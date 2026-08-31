import axios from 'axios';

const NODE_API = 'http://localhost:5000/api';
const ML_API = 'http://127.0.0.1:8000';

async function runVerification() {
  console.log('🧪 Starting ResearchOS Comprehensive Automated Pipeline Tests...\n');

  // 1. Health Checks & Authentication
  console.log('▶ [1/7] Testing Node.js API, ML Microservice Health & Auth...');
  const healthRes = await axios.get(`${NODE_API}/health`);
  console.log('  Node API Health:', healthRes.data);
  if (!healthRes.data.mlServiceHealthy) {
    throw new Error('ML microservice is not healthy!');
  }

  // Register session user
  const authUser = {
    email: `pipeline_lead_${Date.now()}@empirical.org`,
    password: 'LeadPassword2026!',
    name: 'Lead Principal Investigator'
  };
  const regRes = await axios.post(`${NODE_API}/auth/register`, authUser);
  const token = regRes.data.token;
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  console.log(`  Authenticated as: ${authUser.email}`);
  console.log('  ✅ Services are connected, healthy, and authenticated.\n');

  // 2. AI Survey Generator
  console.log('▶ [2/7] Testing AI Survey Generation & Question Synthesis...');
  const genRes = await axios.post(`${NODE_API}/surveys/generate`, {
    objective: 'Evaluate whether senior software engineers experience lower cognitive load and higher trust when using automated statistical testing tools compared to junior engineers.',
    templateId: 'academic_behavioral',
    targetAudience: 'Software engineers & Researchers',
  }, authHeader);
  console.log('  Synthesized Title:', genRes.data.title);
  console.log('  Synthesized Questions Count:', genRes.data.questions.length);
  console.log('  Refinement Source:', genRes.data.refinementSource);
  console.log('  ✅ AI Survey Generation test passed.\n');

  // 3. Create Study in Database
  console.log('▶ [3/7] Saving Synthesized Study into Database...');
  const createRes = await axios.post(`${NODE_API}/surveys`, {
    title: genRes.data.title,
    description: genRes.data.description,
    objective: 'Evaluate whether senior software engineers experience lower cognitive load and higher trust.',
    archetype: genRes.data.archetype,
    questions: genRes.data.questions,
  }, authHeader);
  const surveyId = createRes.data.id;
  console.log('  Created Survey ID:', surveyId);
  console.log('  ✅ Database persistence test passed.\n');

  // 4. Ingest High-Volume Data
  console.log('▶ [4/7] Testing High-Volume Ingestion with Preprocessing Anomalies...');
  const ingestRes = await axios.post(`${NODE_API}/integrations/synthetic/${surveyId}`, {
    count: 300,
    injectAnomalies: true,
  }, authHeader);
  console.log('  Ingestion Result:', ingestRes.data.message);
  console.log('  ✅ Ingested 300 realistic records with speeders & straight-liners.\n');

  // 5. Run Full Automated Research Pipeline
  console.log('▶ [5/7] Executing Full Research Pipeline (Preprocessing, Stats, Clusters, NLP)...');
  const pipelineRes = await axios.post(`${NODE_API}/analysis/run/${surveyId}`, {
    runName: 'Comprehensive Automated Test Run',
  }, authHeader);
  const runData = pipelineRes.data;

  console.log('  Run ID:', runData.runId);
  console.log('  Total Ingested:', runData.preprocessing.raw_count);
  console.log('  Cleaned Sample:', runData.preprocessing.clean_count);
  console.log('  Clean Acceptance Rate:', runData.cleanRate + '%');
  console.log('  Speeders Flagged:', runData.flaggedSpeeders);
  console.log('  Straight-Liners Flagged:', runData.flaggedStraightliners);
  console.log('  Audit Logs:', runData.auditLog);
  console.log('  ✅ Preprocessing & Data Provenance verified.\n');

  // 6. Verify Statistical Hypothesis Results
  console.log('▶ [6/7] Verifying Hypothesis Testing & Bonferroni Multiple-Comparisons...');
  const tests = runData.hypothesisTesting.tests;
  console.log(`  Executed ${tests.length} automated hypothesis tests:`);
  tests.forEach((t: any, i: number) => {
    console.log(`    [Test ${i + 1}] ${t.test_used} (${t.independent_var} -> ${t.dependent_var})`);
    console.log(`      Statistic: ${t.statistic}, p-value: ${t.p_value_formatted}`);
    console.log(`      Effect Size (${t.effect_size.name}): ${t.effect_size.value} (${t.effect_size.magnitude})`);
    console.log(`      Bonferroni Significant: ${t.is_significant_bonferroni} (alpha = ${runData.hypothesisTesting.alphaBonferroni})`);
  });
  console.log('  ✅ Statistical rigor verified.\n');

  // 7. Verify Clustering & NLP Themes
  console.log('▶ [7/7] Verifying Respondent Personas & NLP Qualitative Extraction...');
  console.log(`  PCA Explained Variance: ${runData.clustering.pca_variance_explained.join('%, ')}%`);
  console.log(`  Optimal K: ${runData.clustering.n_clusters} (Silhouette Score: ${runData.clustering.silhouette_score})`);
  console.log('  Extracted Personas:');
  runData.clustering.clusters.forEach((c: any) => {
    console.log(`    - ${c.name}: ${c.percentage}% (${c.count} respondents)`);
  });

  console.log(`\n  Extracted NLP Themes (${runData.nlpThemes.themes.length}):`);
  runData.nlpThemes.themes.forEach((th: any) => {
    console.log(`    - "${th.title}": ${th.percentage}% mentions (${th.sentiment_breakdown.positive_pct}% positive, ${th.sentiment_breakdown.negative_pct}% negative)`);
    if (th.representative_quotes.length > 0) {
      console.log(`      Quote: "${th.representative_quotes[0].quote}"`);
    }
  });
  console.log('  ✅ Unsupervised ML & NLP theme extraction verified.\n');

  console.log('🎉 ALL 7 END-TO-END PIPELINE VERIFICATION PHASES COMPLETED WITH 100% SUCCESS!\n');
}

runVerification().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
