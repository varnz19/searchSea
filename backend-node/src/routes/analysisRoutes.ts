import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { mlClient } from '../services/mlClient';
import { requireAuth } from '../middleware/authMiddleware';
import { activityService } from '../services/activityService';

const router = Router();
const prisma = new PrismaClient();

// Full Automated Research Pipeline Analysis Run
router.post('/run/:surveyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const surveyId = req.params.surveyId;
    const { runName = `Automated Pipeline Run #${Date.now().toString().slice(-4)}` } = req.body;

    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const rawResponses = await prisma.response.findMany({
      where: { surveyId },
      orderBy: { createdAt: 'asc' },
    });

    if (rawResponses.length < 5) {
      return res.status(400).json({
        error: 'At least 5 responses are required to run statistical analysis. Please ingest or generate responses first.',
      });
    }

    // Build question metadata dictionary
    const questionMeta: Record<string, any> = {};
    survey.questions.forEach((q) => {
      questionMeta[q.code] = {
        type: q.type,
        title: q.title,
        options: q.optionsJson ? JSON.parse(q.optionsJson) : undefined,
      };
    });

    // Extract response data records
    const parsedData = rawResponses.map((r) => {
      let data: Record<string, any> = {};
      try {
        data = JSON.parse(r.dataJson);
      } catch {
        data = {};
      }
      return {
        id: r.id,
        respondent_id: r.respondentId,
        duration_seconds: r.durationSeconds || 120.0,
        ...data,
      };
    });

    // 1. STEP 1: Preprocessing & Data Cleaning
    const preprocessed = await mlClient.preprocessDataset({
      responses: parsedData,
      questionMetadata: questionMeta,
      speederThresholdSeconds: 25.0,
      straightlineStdThreshold: 0.30,
      missingStrategy: 'impute_median',
    });

    const cleanData = preprocessed.clean_data;

    // 2. STEP 2: Automated Hypothesis Testing
    // Identify independent demographic / categorical variables and numeric dependent variables
    const categoricalKeys: string[] = [];
    const numericKeys: string[] = [];
    const openTextKeys: string[] = [];

    // Check user_segment or role columns
    if (cleanData.length > 0 && 'user_segment' in cleanData[0]) {
      categoricalKeys.push('user_segment');
    }

    survey.questions.forEach((q) => {
      if (q.type === 'multiple_choice') {
        categoricalKeys.push(q.code);
      } else if (q.type === 'likert' || q.type === 'numeric') {
        numericKeys.push(q.code);
      } else if (q.type === 'open_ended') {
        openTextKeys.push(q.code);
      }
    });

    // Generate candidate hypothesis tests across key metrics
    const hypothesisPairs: Array<{ iv: string; dv: string }> = [];
    categoricalKeys.forEach((iv) => {
      numericKeys.slice(0, 3).forEach((dv) => {
        hypothesisPairs.push({ iv, dv });
      });
    });

    // If correlation candidates exist
    if (numericKeys.length >= 2) {
      hypothesisPairs.push({ iv: numericKeys[0], dv: numericKeys[1] });
    }

    const totalHypothesisCount = Math.max(1, hypothesisPairs.length);
    const hypothesisResults = [];

    for (const pair of hypothesisPairs) {
      try {
        const testRes = await mlClient.runHypothesisTest({
          data: cleanData,
          independentVar: pair.iv,
          dependentVar: pair.dv,
          testType: 'auto',
          significanceLevel: 0.05,
          totalTestsInBatch: totalHypothesisCount,
        });
        hypothesisResults.push(testRes);
      } catch (err: any) {
        console.warn(`Skipping hypothesis test ${pair.iv} vs ${pair.dv}:`, err.message);
      }
    }

    // 3. STEP 3: Respondent Clustering (K-Means & PCA)
    const clusterFeatures = [...numericKeys, ...categoricalKeys.slice(0, 2)];
    let clusterResult = null;
    if (clusterFeatures.length >= 2 && cleanData.length >= 6) {
      try {
        clusterResult = await mlClient.clusterRespondents({
          data: cleanData,
          featureKeys: clusterFeatures,
          method: 'kmeans',
        });
      } catch (err: any) {
        console.warn('Clustering error:', err.message);
      }
    }

    // 4. STEP 4: NLP Theme Extraction
    let nlpResult = null;
    const textPool: string[] = [];
    openTextKeys.forEach((k) => {
      cleanData.forEach((row) => {
        if (row[k] && typeof row[k] === 'string' && row[k].trim().length > 3) {
          textPool.push(row[k]);
        }
      });
    });

    if (textPool.length >= 3) {
      try {
        nlpResult = await mlClient.extractThemes({
          texts: textPool,
          nThemes: 4,
        });
      } catch (err: any) {
        console.warn('NLP extraction error:', err.message);
      }
    }

    // 5. STEP 5: Assemble and Version the Analysis Run in DB
    const flaggedSpeeders = preprocessed.flagged_records.filter((r) => r.reason.includes('Speeder')).length;
    const flaggedStraightliners = preprocessed.flagged_records.filter((r) => r.reason.includes('Straight-lining')).length;

    const fullSnapshot = {
      runName,
      surveyTitle: survey.title,
      objective: survey.objective,
      totalResponses: preprocessed.raw_count,
      cleanResponses: preprocessed.clean_count,
      cleanRate: preprocessed.clean_rate,
      flaggedSpeeders,
      flaggedStraightliners,
      preprocessing: preprocessed,
      hypothesisTesting: {
        totalTests: hypothesisResults.length,
        alphaRaw: 0.05,
        alphaBonferroni: 0.05 / totalHypothesisCount,
        tests: hypothesisResults,
      },
      clustering: clusterResult,
      nlpThemes: nlpResult,
    };

    const savedRun = await prisma.analysisRun.create({
      data: {
        surveyId,
        runName,
        totalResponses: preprocessed.raw_count,
        cleanResponses: preprocessed.clean_count,
        cleanRate: preprocessed.clean_rate,
        flaggedSpeeders,
        flaggedStraightliners,
        preprocessedDataJson: JSON.stringify(cleanData.slice(0, 100)), // store clean sample
        auditLogJson: JSON.stringify(preprocessed.audit_log),
        resultsJson: JSON.stringify(fullSnapshot),
      },
    });

    // Update survey status to ANALYZED
    await prisma.survey.update({
      where: { id: surveyId },
      data: { status: 'ANALYZED' },
    });

    if (req.user) {
      await activityService.log({
        userId: req.user.id,
        action: 'PIPELINE_EXECUTED',
        details: `Executed empirical pipeline on "${survey.title}" (${preprocessed.clean_count} clean records, ${hypothesisResults.length} hypothesis tests).`,
        entityId: savedRun.id,
        entityType: 'AnalysisRun',
      });
    }

    res.json({
      runId: savedRun.id,
      ...fullSnapshot,
    });
  } catch (error: any) {
    console.error('Pipeline analysis run failed:', error);
    res.status(500).json({ error: error.message || 'Analysis pipeline failure' });
  }
});

// Custom interactive hypothesis test on clean dataset
router.post('/custom-hypothesis/:surveyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { independentVar, dependentVar, testType = 'auto', significanceLevel = 0.05 } = req.body;
    const surveyId = req.params.surveyId;

    const rawResponses = await prisma.response.findMany({ where: { surveyId } });
    if (rawResponses.length === 0) {
      return res.status(400).json({ error: 'No response data available.' });
    }

    const parsedData = rawResponses.map((r) => {
      try {
        return JSON.parse(r.dataJson);
      } catch {
        return {};
      }
    });

    const testRes = await mlClient.runHypothesisTest({
      data: parsedData,
      independentVar,
      dependentVar,
      testType,
      significanceLevel: Number(significanceLevel),
      totalTestsInBatch: 1,
    });

    res.json(testRes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List all analysis runs for a survey
router.get('/runs/:surveyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const runs = await prisma.analysisRun.findMany({
      where: { surveyId: req.params.surveyId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(runs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single analysis run detail
router.get('/run-detail/:runId', requireAuth, async (req: Request, res: Response) => {
  try {
    const run = await prisma.analysisRun.findUnique({
      where: { id: req.params.runId },
    });

    if (!run) {
      return res.status(404).json({ error: 'Analysis run not found' });
    }

    const fullSnapshot = run.resultsJson ? JSON.parse(run.resultsJson) : {};
    res.json({
      id: run.id,
      surveyId: run.surveyId,
      runName: run.runName,
      createdAt: run.createdAt,
      totalResponses: run.totalResponses,
      cleanResponses: run.cleanResponses,
      cleanRate: run.cleanRate,
      flaggedSpeeders: run.flaggedSpeeders,
      flaggedStraightliners: run.flaggedStraightliners,
      auditLog: run.auditLogJson ? JSON.parse(run.auditLogJson) : [],
      ...fullSnapshot,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
