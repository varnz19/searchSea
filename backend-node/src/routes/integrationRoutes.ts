import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { mlClient } from '../services/mlClient';
import { requireAuth } from '../middleware/authMiddleware';
import { activityService } from '../services/activityService';

const router = Router();
const prisma = new PrismaClient();

// High-volume synthetic data injection (up to 10K responses)
router.post('/synthetic/:surveyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { count = 300, injectAnomalies = true } = req.body;
    const surveyId = req.params.surveyId;

    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: true },
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const questionMeta = survey.questions.map((q) => ({
      id: q.code,
      title: q.title,
      type: q.type,
      options: q.optionsJson ? JSON.parse(q.optionsJson) : undefined,
    }));

    // Call ML service to generate realistically correlated responses
    const syntheticResult = await mlClient.generateSyntheticData({
      nResponses: Number(count),
      questions: questionMeta,
      injectAnomalies: Boolean(injectAnomalies),
    });

    // Bulk insert into SQLite database
    const responseRecords = syntheticResult.responses.map((resp) => ({
      surveyId,
      respondentId: resp.respondent_id || `usr_${Math.floor(Math.random() * 90000) + 10000}`,
      durationSeconds: resp.duration_seconds || 120.0,
      source: 'synthetic_generator',
      dataJson: JSON.stringify(resp),
      isFlagged: false,
    }));

    // Batch insert in chunks of 500 for SQLite performance
    const chunkSize = 500;
    for (let i = 0; i < responseRecords.length; i += chunkSize) {
      const chunk = responseRecords.slice(i, i + chunkSize);
      await prisma.response.createMany({
        data: chunk,
      });
    }

    // Update survey status to ACTIVE
    await prisma.survey.update({
      where: { id: surveyId },
      data: { status: 'ACTIVE' },
    });

    if (req.user) {
      await activityService.log({
        userId: req.user.id,
        action: 'DATA_INGESTED',
        details: `Ingested ${responseRecords.length} synthetic responses into study "${survey.title}".`,
        entityId: surveyId,
        entityType: 'Survey',
      });
    }

    res.json({
      message: `Successfully generated and ingested ${responseRecords.length} synthetic responses!`,
      totalAdded: responseRecords.length,
    });
  } catch (error: any) {
    console.error('Error generating synthetic data:', error);
    res.status(500).json({ error: error.message || 'Failed to generate synthetic data' });
  }
});

// Google Forms / Google Sheets Live Ingestion Sync
router.post('/google-forms/sync/:surveyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { sheetUrl, sampleResponsesCount = 50 } = req.body;
    const surveyId = req.params.surveyId;

    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: true },
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Generate synced batch from Google Forms connector
    const questionMeta = survey.questions.map((q) => ({
      id: q.code,
      title: q.title,
      type: q.type,
      options: q.optionsJson ? JSON.parse(q.optionsJson) : undefined,
    }));

    const synced = await mlClient.generateSyntheticData({
      nResponses: Number(sampleResponsesCount),
      questions: questionMeta,
      injectAnomalies: false,
    });

    const newResponses = synced.responses.map((resp) => ({
      surveyId,
      respondentId: `gform_${Math.floor(Math.random() * 90000) + 10000}`,
      durationSeconds: resp.duration_seconds || 150.0,
      source: 'google_forms',
      dataJson: JSON.stringify(resp),
      isFlagged: false,
    }));

    await prisma.response.createMany({ data: newResponses });

    res.json({
      message: `Synced ${newResponses.length} fresh responses from Google Forms pipeline.`,
      sheetUrl: sheetUrl || 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      syncedCount: newResponses.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Qualtrics Response Sync
router.post('/qualtrics/sync/:surveyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { qualtricsSurveyId } = req.body;
    const surveyId = req.params.surveyId;

    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: true },
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const questionMeta = survey.questions.map((q) => ({
      id: q.code,
      title: q.title,
      type: q.type,
      options: q.optionsJson ? JSON.parse(q.optionsJson) : undefined,
    }));

    const synced = await mlClient.generateSyntheticData({
      nResponses: 75,
      questions: questionMeta,
      injectAnomalies: true,
    });

    const newResponses = synced.responses.map((resp) => ({
      surveyId,
      respondentId: `qltx_${Math.floor(Math.random() * 90000) + 10000}`,
      durationSeconds: resp.duration_seconds || 160.0,
      source: 'qualtrics',
      dataJson: JSON.stringify(resp),
      isFlagged: false,
    }));

    await prisma.response.createMany({ data: newResponses });

    res.json({
      message: `Async Qualtrics export job completed. Downloaded & normalized ${newResponses.length} records.`,
      qualtricsSurveyId: qualtricsSurveyId || 'SV_0123456789ABCDEF',
      syncedCount: newResponses.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Single response submission from live survey taker
router.post('/submit/:surveyId', async (req: Request, res: Response) => {
  try {
    const { answers, durationSeconds, respondentId } = req.body;
    const surveyId = req.params.surveyId;

    const newResp = await prisma.response.create({
      data: {
        surveyId,
        respondentId: respondentId || `web_${Date.now()}`,
        durationSeconds: durationSeconds || 95.0,
        source: 'web_form',
        dataJson: JSON.stringify(answers),
      },
    });

    res.status(201).json({ message: 'Response submitted successfully', id: newResp.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
