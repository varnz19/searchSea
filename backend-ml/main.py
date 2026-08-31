import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import scipy.stats as stats
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import math
import random

app = FastAPI(
    title="SearchSea ML & Statistical Engine",
    description="Microservice for data preprocessing, hypothesis testing, respondent clustering, and NLP theme extraction.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Models & Schemas
# -------------------------------------------------------------

class PreprocessRequest(BaseModel):
    responses: List[Dict[str, Any]]
    question_metadata: Dict[str, Dict[str, Any]] # e.g. {"q1": {"type": "likert", "min": 1, "max": 5}}
    speeder_threshold_seconds: Optional[float] = 30.0
    straightline_std_threshold: Optional[float] = 0.35
    missing_strategy: Optional[str] = "impute_median" # "impute_median", "drop_listwise"

class HypothesisTestRequest(BaseModel):
    data: List[Dict[str, Any]]
    independent_var: str
    dependent_var: str
    test_type: Optional[str] = "auto" # "auto", "ttest", "mann_whitney", "anova", "kruskal", "chi_square", "correlation"
    significance_level: Optional[float] = 0.05
    total_tests_in_batch: Optional[int] = 1

class ClusterRequest(BaseModel):
    data: List[Dict[str, Any]]
    feature_keys: List[str]
    n_clusters: Optional[int] = None # None means auto-pick via silhouette score
    method: Optional[str] = "kmeans" # "kmeans", "hierarchical"

class NLPThemeRequest(BaseModel):
    texts: List[str]
    n_themes: Optional[int] = 4

class SyntheticDataRequest(BaseModel):
    n_responses: int = 250
    questions: List[Dict[str, Any]]
    inject_anomalies: bool = True

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "SearchSea ML Microservice",
        "version": "1.0.0"
    }

# --- 1. PREPROCESSING ---
@app.post("/api/preprocess")
def preprocess_dataset(req: PreprocessRequest):
    if not req.responses:
        raise HTTPException(status_code=400, detail="Empty response list provided.")

    df = pd.DataFrame(req.responses)
    raw_count = len(df)
    audit_log = []
    
    # Identify Likert / numeric question keys
    likert_keys = [
        k for k, meta in req.question_metadata.items()
        if meta.get("type") in ["likert", "numeric", "rating", "scale"] and k in df.columns
    ]
    
    flagged_records = []
    
    # 1. Speeder Detection
    if "duration_seconds" in df.columns:
        df["duration_seconds"] = pd.to_numeric(df["duration_seconds"], errors="coerce")
        median_time = float(df["duration_seconds"].median(skipna=True) or 60.0)
        cutoff = max(req.speeder_threshold_seconds or 15.0, median_time * 0.25)
        speeders = df[df["duration_seconds"] < cutoff].index.tolist()
        for idx in speeders:
            flagged_records.append({
                "response_id": str(df.iloc[idx].get("id", idx)),
                "index": int(idx),
                "reason": "Speeder (Completion time below threshold)",
                "detail": f"Duration: {df.iloc[idx].get('duration_seconds')}s vs cutoff {cutoff:.1f}s"
            })
        audit_log.append(f"Flagged {len(speeders)} speeders completing survey faster than {cutoff:.1f}s.")

    # 2. Straight-lining Detection across Likert matrix
    if len(likert_keys) >= 3:
        likert_df = df[likert_keys].apply(pd.to_numeric, errors="coerce")
        row_stds = likert_df.std(axis=1)
        straightliners = row_stds[row_stds <= req.straightline_std_threshold].index.tolist()
        for idx in straightliners:
            flagged_records.append({
                "response_id": str(df.iloc[idx].get("id", idx)),
                "index": int(idx),
                "reason": "Straight-lining (Near-zero variance across rating items)",
                "detail": f"Standard Deviation: {row_stds[idx]:.3f}"
            })
        audit_log.append(f"Flagged {len(straightliners)} straight-liners with std dev <= {req.straightline_std_threshold}.")

    # 3. Gibberish / Low-Effort Text Filter (Shannon entropy + length heuristic)
    open_ended_keys = [
        k for k, meta in req.question_metadata.items()
        if meta.get("type") in ["open_ended", "text"] and k in df.columns
    ]
    gibberish_count = 0
    for oe_key in open_ended_keys:
        for idx, val in df[oe_key].items():
            if not isinstance(val, str) or len(val.strip()) == 0:
                continue
            text = val.strip()
            # Flag if very short (< 10 chars) or extremely repetitive (low entropy)
            if len(text) < 10:
                flagged_records.append({
                    "response_id": str(df.iloc[idx].get("id", idx)),
                    "index": int(idx),
                    "reason": f"Low-effort text in '{oe_key}' (too short: {len(text)} chars)",
                    "detail": f"Text: '{text[:50]}'"
                })
                gibberish_count += 1
                continue
            # Shannon entropy check on character distribution
            freq = {}
            for ch in text.lower():
                freq[ch] = freq.get(ch, 0) + 1
            total_chars = len(text)
            entropy = -sum((c / total_chars) * math.log2(c / total_chars) for c in freq.values() if c > 0)
            # English text typically has entropy 3.5-5.0; gibberish/keyboard mashing is < 2.5
            if entropy < 2.5:
                flagged_records.append({
                    "response_id": str(df.iloc[idx].get("id", idx)),
                    "index": int(idx),
                    "reason": f"Gibberish text in '{oe_key}' (low entropy: {entropy:.2f})",
                    "detail": f"Text: '{text[:50]}'"
                })
                gibberish_count += 1
    if gibberish_count > 0:
        audit_log.append(f"Flagged {gibberish_count} low-effort/gibberish open-ended responses.")

    # Deduplicate flagged row indices
    flagged_indices = set(item["index"] for item in flagged_records)
    
    # Clean dataset creation
    clean_df = df.drop(index=list(flagged_indices)).copy()
    
    # 3. Missing data handling
    missing_audit = {}
    for col in clean_df.columns:
        if col in ["id", "created_at", "duration_seconds", "respondent_id"]:
            continue
        missing_count = int(clean_df[col].isna().sum())
        if missing_count > 0:
            missing_pct = (missing_count / len(clean_df)) * 100
            meta = req.question_metadata.get(col, {})
            q_type = meta.get("type", "text")
            
            if q_type in ["likert", "numeric", "rating", "scale"]:
                clean_df[col] = pd.to_numeric(clean_df[col], errors="coerce")
                if req.missing_strategy == "impute_median":
                    med_val = clean_df[col].median(skipna=True)
                    clean_df[col] = clean_df[col].fillna(med_val)
                    missing_audit[col] = f"Imputed {missing_count} missing values ({missing_pct:.1f}%) with median {med_val}"
            elif q_type in ["multiple_choice", "single_choice", "dropdown"]:
                mode_val = clean_df[col].mode(dropna=True)
                if not mode_val.empty:
                    clean_df[col] = clean_df[col].fillna(mode_val[0])
                    missing_audit[col] = f"Imputed {missing_count} categorical missing with mode '{mode_val[0]}'"
            else:
                clean_df[col] = clean_df[col].fillna("")
                
    if missing_audit:
        audit_log.append(f"Handled missing values in {len(missing_audit)} columns.")

    clean_count = len(clean_df)
    clean_records = clean_df.to_dict(orient="records")

    return {
        "raw_count": raw_count,
        "clean_count": clean_count,
        "flagged_count": len(flagged_indices),
        "clean_rate": round((clean_count / raw_count) * 100, 2) if raw_count > 0 else 0,
        "flagged_records": flagged_records,
        "audit_log": audit_log,
        "missing_summary": missing_audit,
        "clean_data": clean_records
    }

# --- 2. STATISTICAL HYPOTHESIS TESTING ---
@app.post("/api/stats/hypothesize")
def run_hypothesis_test(req: HypothesisTestRequest):
    df = pd.DataFrame(req.data)
    if req.independent_var not in df.columns or req.dependent_var not in df.columns:
        raise HTTPException(
            status_code=400, 
            detail=f"Variables '{req.independent_var}' or '{req.dependent_var}' not found in data."
        )

    iv = df[req.independent_var]
    dv = df[req.dependent_var]

    # Clean missing pairs
    valid_mask = iv.notna() & dv.notna()
    df_clean = df[valid_mask].copy()
    
    if len(df_clean) < 5:
        raise HTTPException(status_code=400, detail="Insufficient valid sample size (< 5 pairs) to test.")

    iv_clean = df_clean[req.independent_var]
    dv_clean = df_clean[req.dependent_var]

    # Determine types
    iv_is_numeric = pd.to_numeric(iv_clean, errors="coerce").notna().all()
    dv_is_numeric = pd.to_numeric(dv_clean, errors="coerce").notna().all()

    test_used = ""
    statistic = 0.0
    p_value = 1.0
    effect_size_name = ""
    effect_size_val = 0.0
    degrees_of_freedom = None
    group_stats = {}
    normality_checked = False
    normality_p_val = None
    is_normal = True
    assumptions_note = ""

    # Decision Tree
    if dv_is_numeric and not iv_is_numeric:
        # Group comparison on numeric DV (e.g. Satisfaction by Role)
        dv_numeric = pd.to_numeric(dv_clean)
        groups = [dv_numeric[iv_clean == cat].values for cat in iv_clean.unique() if len(dv_numeric[iv_clean == cat]) >= 3]
        group_names = [str(cat) for cat in iv_clean.unique() if len(dv_numeric[iv_clean == cat]) >= 3]

        for name, grp in zip(group_names, groups):
            group_stats[name] = {
                "count": int(len(grp)),
                "mean": float(np.mean(grp)),
                "std": float(np.std(grp, ddof=1) if len(grp) > 1 else 0.0),
                "median": float(np.median(grp))
            }

        if len(groups) == 2:
            # 2 Groups -> Test normality (Shapiro-Wilk + D'Agostino-Pearson)
            normality_checked = True
            try:
                stat_shapiro, p_shapiro = stats.shapiro(dv_numeric)
                normality_p_val = float(p_shapiro)
                is_normal = p_shapiro > 0.05
                # Secondary normality check: D'Agostino-Pearson omnibus test
                if len(dv_numeric) >= 20:  # D'Agostino requires n >= 20
                    stat_dagostino, p_dagostino = stats.normaltest(dv_numeric)
                    # Both tests must agree on normality
                    is_normal = is_normal and (p_dagostino > 0.05)
                    normality_p_val = float(min(p_shapiro, p_dagostino))  # Report most conservative
            except Exception:
                is_normal = True

            if is_normal and req.test_type in ["auto", "ttest"]:
                # Welch's t-test (robust against unequal variances)
                t_stat, p_val = stats.ttest_ind(groups[0], groups[1], equal_var=False)
                test_used = "Welch's Two-Sample t-Test"
                statistic = float(t_stat)
                p_value = float(p_val)
                degrees_of_freedom = float(len(groups[0]) + len(groups[1]) - 2)
                # Cohen's d
                n1, n2 = len(groups[0]), len(groups[1])
                s1, s2 = np.std(groups[0], ddof=1), np.std(groups[1], ddof=1)
                pooled_sd = math.sqrt(((n1 - 1)*s1**2 + (n2 - 1)*s2**2) / (n1 + n2 - 2)) if (n1 + n2 > 2) else 1.0
                effect_size_name = "Cohen's d"
                effect_size_val = float((np.mean(groups[0]) - np.mean(groups[1])) / (pooled_sd or 1.0))
                assumptions_note = "Continuous dependent variable, independent samples. Normality assumption satisfied."
            else:
                # Mann-Whitney U test (non-parametric)
                u_stat, p_val = stats.mannwhitneyu(groups[0], groups[1], alternative='two-sided')
                test_used = "Mann-Whitney U Test (Non-parametric)"
                statistic = float(u_stat)
                p_value = float(p_val)
                # Rank-biserial correlation for Mann-Whitney
                n1, n2 = len(groups[0]), len(groups[1])
                r_biserial = 1 - (2 * u_stat) / (n1 * n2) if (n1 * n2 > 0) else 0.0
                effect_size_name = "Rank-Biserial Correlation (r)"
                effect_size_val = float(r_biserial)
                assumptions_note = "Non-normal distribution detected (Shapiro-Wilk p < 0.05). Fallback to non-parametric rank test."

        elif len(groups) > 2:
            # 3+ Groups -> ANOVA or Kruskal-Wallis
            normality_checked = True
            try:
                stat_shapiro, p_shapiro = stats.shapiro(dv_numeric)
                normality_p_val = float(p_shapiro)
                is_normal = p_shapiro > 0.05
                # Secondary normality check: D'Agostino-Pearson omnibus test
                if len(dv_numeric) >= 20:
                    stat_dagostino, p_dagostino = stats.normaltest(dv_numeric)
                    is_normal = is_normal and (p_dagostino > 0.05)
                    normality_p_val = float(min(p_shapiro, p_dagostino))
            except Exception:
                is_normal = True

            if is_normal and req.test_type in ["auto", "anova"]:
                f_stat, p_val = stats.f_oneway(*groups)
                test_used = "One-Way ANOVA (Analysis of Variance)"
                statistic = float(f_stat)
                p_value = float(p_val)
                # Eta squared
                grand_mean = np.mean(dv_numeric)
                ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in groups)
                ss_total = sum((x - grand_mean)**2 for x in dv_numeric)
                eta_sq = ss_between / ss_total if ss_total > 0 else 0.0
                effect_size_name = "Eta-Squared (η²)"
                effect_size_val = float(eta_sq)
                assumptions_note = "Parametric ANOVA across 3+ groups. Homogeneity and normality assumed."
            else:
                h_stat, p_val = stats.kruskal(*groups)
                test_used = "Kruskal-Wallis H Test (Non-parametric ANOVA)"
                statistic = float(h_stat)
                p_value = float(p_val)
                # Epsilon squared
                n_total = len(dv_numeric)
                k_grps = len(groups)
                eps_sq = (h_stat - k_grps + 1) / (n_total - k_grps) if (n_total > k_grps) else 0.0
                effect_size_name = "Epsilon-Squared (ε²)"
                effect_size_val = float(max(0.0, eps_sq))
                assumptions_note = "Non-normal distribution across multiple groups. Executed Kruskal-Wallis rank test."
        else:
            raise HTTPException(status_code=400, detail="Independent variable contains fewer than 2 groups with adequate samples.")

    elif iv_is_numeric and dv_is_numeric:
        # Correlation
        iv_num = pd.to_numeric(iv_clean)
        dv_num = pd.to_numeric(dv_clean)
        try:
            r_stat, p_val = stats.pearsonr(iv_num, dv_num)
            test_used = "Pearson Correlation Coefficient"
            statistic = float(r_stat)
            p_value = float(p_val)
            effect_size_name = "Coefficient of Determination (R²)"
            effect_size_val = float(r_stat ** 2)
            assumptions_note = "Continuous linear correlation check."
        except Exception:
            r_stat, p_val = stats.spearmanr(iv_num, dv_num)
            test_used = "Spearman Rank Correlation (Non-parametric)"
            statistic = float(r_stat)
            p_value = float(p_val)
            effect_size_name = "Spearman Rho (ρ)"
            effect_size_val = float(r_stat)
            assumptions_note = "Monotonic rank relationship."

    else:
        # Categorical vs Categorical -> Chi-Square or Fisher's Exact Test
        contingency = pd.crosstab(iv_clean, dv_clean)
        chi2, p_val, dof, expected = stats.chi2_contingency(contingency)

        # Fisher's exact test for 2x2 tables with small expected cell counts
        use_fisher = False
        if contingency.shape == (2, 2):
            min_expected = expected.min()
            if min_expected < 5:
                use_fisher = True
                try:
                    odds_ratio, p_val_fisher = stats.fisher_exact(contingency)
                    test_used = "Fisher's Exact Test"
                    statistic = float(odds_ratio)
                    p_value = float(p_val_fisher)
                    degrees_of_freedom = None
                    effect_size_name = "Odds Ratio"
                    effect_size_val = float(odds_ratio)
                    assumptions_note = f"2x2 contingency table with min expected count {min_expected:.1f} < 5. Fisher's exact test used instead of Chi-square."
                except Exception:
                    use_fisher = False  # Fall back to chi-square

        if not use_fisher:
            test_used = "Pearson's Chi-Square Test of Independence"
            statistic = float(chi2)
            p_value = float(p_val)
            degrees_of_freedom = float(dof)
            # Cramér's V
            n = contingency.sum().sum()
            min_dim = min(contingency.shape) - 1
            cramers_v = math.sqrt(chi2 / (n * min_dim)) if (n * min_dim > 0) else 0.0
            effect_size_name = "Cramér's V"
            effect_size_val = float(cramers_v)
            assumptions_note = "Categorical contingency table test of independent distributions."
        
        # Format contingency table for UI
        for idx_label, row in contingency.iterrows():
            group_stats[str(idx_label)] = {str(col): int(val) for col, val in row.items()}

    # Multiple Comparisons Adjustment (Bonferroni & Benjamini-Hochberg)
    k_tests = max(1, req.total_tests_in_batch or 1)
    alpha = req.significance_level or 0.05
    bonferroni_alpha = alpha / k_tests
    is_significant_raw = p_value < alpha
    is_significant_bonferroni = p_value < bonferroni_alpha

    # Benjamini-Hochberg FDR adjustment
    # For a single test in a batch, the BH-adjusted p-value = min(p * k / rank, 1.0)
    # When testing one at a time, rank=1 and adjusted_p = min(p * k, 1.0)
    bh_adjusted_p = min(p_value * k_tests, 1.0)
    is_significant_bh = bh_adjusted_p < alpha

    # Automated plain-English interpretation
    significance_str = "statistically significant" if is_significant_raw else "not statistically significant"
    bonferroni_note = f"Remains significant under Bonferroni correction (α = {bonferroni_alpha:.4f} across {k_tests} simultaneous tests)." if is_significant_bonferroni else (f"Does NOT survive Bonferroni correction for {k_tests} simultaneous tests (threshold α = {bonferroni_alpha:.4f})." if k_tests > 1 else "Single test evaluated.")
    bh_note = f"BH-adjusted p-value: {bh_adjusted_p:.4e}. {'Remains significant' if is_significant_bh else 'Does NOT survive'} under Benjamini-Hochberg FDR control." if k_tests > 1 else ""

    # Plain-English Executive Summary
    summary = (
        f"A {test_used} revealed that the relationship between '{req.independent_var}' and '{req.dependent_var}' "
        f"is {significance_str} (statistic = {statistic:.3f}, p = {p_value:.4e}). "
        f"The effect size ({effect_size_name}) is {abs(effect_size_val):.3f}. {bonferroni_note}"
    )

    return {
        "test_used": test_used,
        "independent_var": req.independent_var,
        "dependent_var": req.dependent_var,
        "statistic": round(statistic, 4),
        "p_value": p_value,
        "p_value_formatted": f"{p_value:.4e}" if p_value < 0.001 else f"{p_value:.4f}",
        "degrees_of_freedom": degrees_of_freedom,
        "effect_size": {
            "name": effect_size_name,
            "value": round(effect_size_val, 4),
            "magnitude": "Large" if abs(effect_size_val) >= 0.5 else ("Medium" if abs(effect_size_val) >= 0.2 else "Small")
        },
        "alpha_raw": alpha,
        "alpha_bonferroni": bonferroni_alpha,
        "bh_adjusted_p_value": bh_adjusted_p,
        "is_significant_raw": is_significant_raw,
        "is_significant_bonferroni": is_significant_bonferroni,
        "is_significant_bh": is_significant_bh,
        "normality_check": {
            "tested": normality_checked,
            "p_value": normality_p_val,
            "is_normal": is_normal
        },
        "assumptions_note": assumptions_note,
        "group_stats": group_stats,
        "executive_summary": summary + (f" {bh_note}" if bh_note else "")
    }

# --- 3. RESPONDENT CLUSTERING & PCA ---
@app.post("/api/cluster")
def cluster_respondents(req: ClusterRequest):
    df = pd.DataFrame(req.data)
    if not req.feature_keys or len(df) < 6:
        raise HTTPException(status_code=400, detail="At least 6 responses and valid feature keys are required.")

    missing_cols = [k for k in req.feature_keys if k not in df.columns]
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Feature keys not found in data: {missing_cols}")

    # Feature matrix preparation
    feature_df = df[req.feature_keys].copy()
    
    # Handle numeric vs categorical
    numeric_cols = []
    cat_cols = []
    for col in req.feature_keys:
        if pd.to_numeric(feature_df[col], errors="coerce").notna().all():
            numeric_cols.append(col)
            feature_df[col] = pd.to_numeric(feature_df[col]).fillna(feature_df[col].median())
        else:
            cat_cols.append(col)
            feature_df[col] = feature_df[col].fillna("Unknown").astype(str)

    if cat_cols:
        encoded_df = pd.get_dummies(feature_df, columns=cat_cols, drop_first=True)
    else:
        encoded_df = feature_df

    scaler = StandardScaler()
    scaled_matrix = scaler.fit_transform(encoded_df)

    # Dimensionality Reduction for 2D visualization
    n_components = min(2, scaled_matrix.shape[1])
    pca = PCA(n_components=n_components, random_state=42)
    pca_coords = pca.fit_transform(scaled_matrix)
    variance_ratio = [float(v) for v in pca.explained_variance_ratio_]

    # Automatic K selection if not provided
    k_evaluations = []
    best_k = 3
    best_score = -1.0

    max_k_to_test = min(8, len(df) - 1)
    if max_k_to_test >= 2:
        for k in range(2, max_k_to_test + 1):
            km_temp = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels_temp = km_temp.fit_predict(scaled_matrix)
            score = float(silhouette_score(scaled_matrix, labels_temp))
            k_evaluations.append({"k": k, "silhouette_score": round(score, 4), "inertia": round(float(km_temp.inertia_), 2)})
            if score > best_score:
                best_score = score
                best_k = k

    chosen_k = req.n_clusters if req.n_clusters is not None else best_k
    chosen_k = max(2, min(chosen_k, len(df) - 1))

    if req.method == "hierarchical":
        model = AgglomerativeClustering(n_clusters=chosen_k)
        labels = model.fit_predict(scaled_matrix)
    else:
        model = KMeans(n_clusters=chosen_k, random_state=42, n_init=10)
        labels = model.fit_predict(scaled_matrix)

    df["cluster_id"] = labels
    final_silhouette = float(silhouette_score(scaled_matrix, labels))

    # Cluster Persona Profiling
    clusters_info = []
    palette = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4"]

    for c_id in range(chosen_k):
        sub_df = df[df["cluster_id"] == c_id]
        size = len(sub_df)
        pct = round((size / len(df)) * 100, 1)
        
        # Calculate key distinguishing numeric traits
        trait_profile = {}
        for num_col in numeric_cols:
            mean_val = float(pd.to_numeric(sub_df[num_col], errors="coerce").mean())
            overall_mean = float(pd.to_numeric(df[num_col], errors="coerce").mean())
            diff = mean_val - overall_mean
            trait_profile[num_col] = {
                "mean": round(mean_val, 2),
                "overall_mean": round(overall_mean, 2),
                "delta": round(diff, 2)
            }

        # Dominant categorical responses
        top_cats = {}
        for c_col in cat_cols:
            mode_series = sub_df[c_col].mode()
            if not mode_series.empty:
                top_cats[c_col] = str(mode_series[0])

        # Persona name heuristics
        top_trait = max(trait_profile.items(), key=lambda x: abs(x[1]["delta"])) if trait_profile else None
        persona_name = f"Segment {chr(65 + c_id)}"
        if top_trait:
            direction = "High" if top_trait[1]["delta"] > 0 else "Low"
            persona_name += f" ({direction} {top_trait[0].replace('_', ' ').title()})"

        clusters_info.append({
            "id": c_id,
            "label": f"Cluster {c_id + 1}",
            "name": persona_name,
            "color": palette[c_id % len(palette)],
            "count": size,
            "percentage": pct,
            "numeric_traits": trait_profile,
            "top_categories": top_cats
        })

    # Points for 2D scatter visualization
    points = []
    for idx, row in df.iterrows():
        points.append({
            "id": str(row.get("id", idx)),
            "x": round(float(pca_coords[idx][0]), 3),
            "y": round(float(pca_coords[idx][1]), 3) if n_components > 1 else 0.0,
            "cluster_id": int(labels[idx]),
            "metadata": {k: str(row.get(k, "")) for k in req.feature_keys[:3]}
        })

    return {
        "n_clusters": chosen_k,
        "method": req.method,
        "silhouette_score": round(final_silhouette, 3),
        "pca_variance_explained": [round(v * 100, 1) for v in variance_ratio],
        "k_evaluations": k_evaluations,
        "clusters": clusters_info,
        "points": points
    }

# --- 4. NLP THEME EXTRACTION & SENTIMENT ---
@app.post("/api/nlp/themes")
def extract_nlp_themes(req: NLPThemeRequest):
    # Filter empty or short responses
    valid_texts = [t.strip() for t in req.texts if isinstance(t, str) and len(t.strip()) > 3]
    if len(valid_texts) < 3:
        return {
            "themes": [],
            "total_analyzed": len(valid_texts),
            "sentiment_overview": {"positive": 0, "neutral": 0, "negative": 0}
        }

    # Lightweight sentiment analysis heuristics (positive / negative lexicons)
    pos_words = set(["great", "love", "excellent", "fast", "intuitive", "helpful", "good", "amazing", "smooth", "easy", "satisfied", "best", "effective", "valuable", "seamless"])
    neg_words = set(["slow", "buggy", "frustrating", "confusing", "hard", "poor", "terrible", "bad", "expensive", "error", "clunky", "disappointed", "lacking", "broken", "issue"])

    def get_sentiment(text: str):
        words = re.findall(r'\b\w+\b', text.lower())
        pos_cnt = sum(1 for w in words if w in pos_words)
        neg_cnt = sum(1 for w in words if w in neg_words)
        score = pos_cnt - neg_cnt
        if score > 0:
            return "positive", min(1.0, 0.5 + score * 0.15)
        elif score < 0:
            return "negative", max(-1.0, -0.5 + score * 0.15)
        return "neutral", 0.0

    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    annotated_responses = []
    for t in valid_texts:
        sentiment, score = get_sentiment(t)
        sentiment_counts[sentiment] += 1
        annotated_responses.append({
            "text": t,
            "sentiment": sentiment,
            "sentiment_score": score
        })

    # TF-IDF Clustering for semantic theme discovery
    n_clusters = min(req.n_themes or 4, len(valid_texts))
    tfidf = TfidfVectorizer(max_features=150, stop_words="english", ngram_range=(1, 2))
    tfidf_matrix = tfidf.fit_transform(valid_texts)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(tfidf_matrix)

    feature_names = tfidf.get_feature_names_out()
    themes = []
    theme_colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"]

    for c_id in range(n_clusters):
        cluster_indices = [i for i, lbl in enumerate(cluster_labels) if lbl == c_id]
        if not cluster_indices:
            continue
            
        # Top TF-IDF keywords for theme
        center = kmeans.cluster_centers_[c_id]
        top_keyword_indices = center.argsort()[::-1][:5]
        top_keywords = [feature_names[i] for i in top_keyword_indices if center[i] > 0]
        
        # Representative quotes (closest to cluster centroid in TF-IDF space)
        cluster_matrix = tfidf_matrix[cluster_indices].toarray()
        distances = np.linalg.norm(cluster_matrix - center, axis=1)
        sorted_rel_indices = distances.argsort()
        
        rep_quotes = []
        for rel_idx in sorted_rel_indices[:3]:
            orig_idx = cluster_indices[rel_idx]
            rep_quotes.append({
                "quote": valid_texts[orig_idx],
                "sentiment": annotated_responses[orig_idx]["sentiment"]
            })

        theme_sentiments = [annotated_responses[i]["sentiment"] for i in cluster_indices]
        pos_pct = round((theme_sentiments.count("positive") / len(theme_sentiments)) * 100)
        neg_pct = round((theme_sentiments.count("negative") / len(theme_sentiments)) * 100)
        
        title = " & ".join([w.title() for w in top_keywords[:2]]) if top_keywords else f"Theme {c_id + 1}"
        
        themes.append({
            "id": c_id,
            "title": title,
            "keywords": top_keywords,
            "count": len(cluster_indices),
            "percentage": round((len(cluster_indices) / len(valid_texts)) * 100, 1),
            "color": theme_colors[c_id % len(theme_colors)],
            "sentiment_breakdown": {
                "positive_pct": pos_pct,
                "negative_pct": neg_pct,
                "neutral_pct": 100 - pos_pct - neg_pct
            },
            "representative_quotes": rep_quotes
        })

    return {
        "themes": sorted(themes, key=lambda x: x["count"], reverse=True),
        "total_analyzed": len(valid_texts),
        "sentiment_overview": sentiment_counts
    }

# --- 5. SYNTHETIC HIGH-VOLUME DATASET GENERATOR ---
@app.post("/api/generate-synthetic-data")
def generate_synthetic_survey_data(req: SyntheticDataRequest):
    n = max(10, min(10000, req.n_responses))
    responses = []
    
    # Realistic personas with correlated attitudes
    # e.g., Power users have higher frequency, higher satisfaction, but specific feature complaints
    # Beginners have lower frequency, higher confusion
    persona_types = ["Power User / Pro", "Regular Practitioner", "Occasional / Beginner", "Enterprise Admin"]
    persona_weights = [0.35, 0.40, 0.20, 0.05]

    open_ended_feedbacks = {
        "positive": [
            "The automated statistical selection saves hours of manual work.",
            "Super clean visualization and exportable reports are executive ready.",
            "Really intuitive interface, integration with our survey flow was seamless.",
            "Fast performance and highly reliable clustering output.",
            "Love the automated Bonferroni correction alerts for multiple testing!"
        ],
        "neutral": [
            "Works well, but would like more customization on chart color schemes.",
            "Good overall platform, takes a few minutes to get used to the interface.",
            "Decent results, looking forward to deeper Qualtrics bi-directional sync."
        ],
        "negative": [
            "Sometimes the page takes a few seconds when loading 10K responses.",
            "Would appreciate an option to export raw SPSS .sav files directly.",
            "Minor formatting issue on mobile view for the contingency tables."
        ]
    }

    for i in range(n):
        resp_id = f"resp_{i+1:05d}"
        persona = random.choices(persona_types, weights=persona_weights)[0]
        
        # Base satisfaction correlated with persona
        if persona == "Power User / Pro":
            base_score = random.choices([4, 5, 3], weights=[0.55, 0.35, 0.10])[0]
            sentiment_choice = random.choices(["positive", "neutral", "negative"], weights=[0.75, 0.20, 0.05])[0]
            duration = random.normalvariate(180, 30)
        elif persona == "Regular Practitioner":
            base_score = random.choices([3, 4, 5, 2], weights=[0.40, 0.40, 0.15, 0.05])[0]
            sentiment_choice = random.choices(["positive", "neutral", "negative"], weights=[0.60, 0.30, 0.10])[0]
            duration = random.normalvariate(140, 25)
        elif persona == "Occasional / Beginner":
            base_score = random.choices([2, 3, 4], weights=[0.35, 0.45, 0.20])[0]
            sentiment_choice = random.choices(["positive", "neutral", "negative"], weights=[0.30, 0.45, 0.25])[0]
            duration = random.normalvariate(110, 20)
        else:
            base_score = random.choices([4, 5, 2], weights=[0.45, 0.45, 0.10])[0]
            sentiment_choice = random.choices(["positive", "neutral", "negative"], weights=[0.50, 0.30, 0.20])[0]
            duration = random.normalvariate(210, 40)

        # Inject Anomalies (Speeders & Straight-liners)
        is_speeder = req.inject_anomalies and (i % 23 == 0)
        is_straightliner = req.inject_anomalies and (i % 31 == 0)

        if is_speeder:
            duration = random.uniform(8.0, 18.0) # speeder anomaly

        record = {
            "id": resp_id,
            "respondent_id": f"usr_{random.randint(1000, 9999)}",
            "duration_seconds": round(max(5.0, duration), 1),
            "user_segment": persona,
        }

        # Populate questions based on question types
        for q in req.questions:
            q_id = q.get("id", "q")
            q_type = q.get("type", "likert")
            options = q.get("options", ["Low", "Medium", "High"])

            if q_type in ["likert", "scale", "rating"]:
                if is_straightliner:
                    record[q_id] = 4 # straight-line constant rating
                else:
                    # Noise around base score bounded in [1, 5]
                    val = int(np.clip(round(random.normalvariate(base_score, 0.6)), 1, 5))
                    record[q_id] = val
            elif q_type in ["multiple_choice", "single_choice", "dropdown"]:
                record[q_id] = random.choice(options)
            elif q_type in ["numeric", "number"]:
                record[q_id] = int(max(1, round(random.normalvariate(base_score * 3, 2))))
            elif q_type in ["open_ended", "text"]:
                record[q_id] = random.choice(open_ended_feedbacks[sentiment_choice])

        responses.append(record)

    return {
        "count": len(responses),
        "responses": responses
    }
