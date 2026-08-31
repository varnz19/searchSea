import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SURVEY_TEMPLATES } from '../services/templates';
import { generateRefinedSurvey } from '../services/llmService';
import { requireAuth } from '../middleware/authMiddleware';
import { activityService } from '../services/activityService';

const router = Router();
const prisma = new PrismaClient();

// Get curated templates
router.get('/templates', (req: Request, res: Response) => {
  res.json(SURVEY_TEMPLATES);
});

// AI-powered survey generator
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { objective, templateId, targetAudience } = req.body;
    if (!objective) {
      return res.status(400).json({ error: 'Research objective is required.' });
    }

    const generated = await generateRefinedSurvey({
      objective,
      templateId,
      targetAudience,
    });

    res.json(generated);
  } catch (error: any) {
    console.error('Error generating survey:', error);
    res.status(500).json({ error: error.message || 'Failed to generate survey' });
  }
});

// List all surveys for the authenticated user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const surveys = await prisma.survey.findMany({
      where: {
        OR: [
          { userId },
          { userId: null } // Fallback for pre-existing records in local dev
        ]
      },
      include: {
        _count: {
          select: { questions: true, responses: true, analysisRuns: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(surveys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single survey details
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const survey = await prisma.survey.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId },
          { userId: null }
        ]
      },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        responses: {
          take: 100, // sample limit for preview
          orderBy: { createdAt: 'desc' },
        },
        analysisRuns: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or access denied.' });
    }

    const formattedQuestions = survey.questions.map((q) => ({
      ...q,
      options: q.optionsJson ? JSON.parse(q.optionsJson) : undefined,
    }));

    res.json({
      ...survey,
      questions: formattedQuestions,
      totalResponsesCount: survey._count.responses,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create survey with questions scoped to authenticated user
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, objective, archetype, questions } = req.body;
    const userId = req.user!.id;

    if (!title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Title and questions array are required.' });
    }

    const created = await prisma.survey.create({
      data: {
        title,
        description,
        objective,
        archetype,
        status: 'DRAFT',
        userId,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            code: q.code || `q_${idx + 1}`,
            title: q.title,
            type: q.type || 'likert',
            optionsJson: q.options ? JSON.stringify(q.options) : null,
            orderIndex: idx,
            required: q.required !== false,
          })),
        },
      },
      include: { questions: true },
    });

    await activityService.log({
      userId,
      action: 'STUDY_CREATED',
      details: `Created new quantitative study protocol: "${created.title}" (${questions.length} items).`,
      entityId: created.id,
      entityType: 'Survey',
    });

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update survey
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, status, questions } = req.body;
    const userId = req.user!.id;

    // Verify ownership
    const existing = await prisma.survey.findFirst({
      where: {
        id: req.params.id,
        OR: [{ userId }, { userId: null }]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Survey not found or access denied.' });
    }

    // Update survey basics
    await prisma.survey.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    });

    // If questions provided, replace them
    if (questions && Array.isArray(questions)) {
      await prisma.question.deleteMany({ where: { surveyId: req.params.id } });
      await prisma.question.createMany({
        data: questions.map((q: any, idx: number) => ({
          surveyId: req.params.id,
          code: q.code || `q_${idx + 1}`,
          title: q.title,
          type: q.type || 'likert',
          optionsJson: q.options ? JSON.stringify(q.options) : null,
          orderIndex: idx,
          required: q.required !== false,
        })),
      });
    }

    const updated = await prisma.survey.findUnique({
      where: { id: req.params.id },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete survey
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const existing = await prisma.survey.findFirst({
      where: {
        id: req.params.id,
        OR: [{ userId }, { userId: null }]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Survey not found or access denied.' });
    }

    await prisma.survey.delete({ where: { id: req.params.id } });

    await activityService.log({
      userId,
      action: 'STUDY_DELETED',
      details: `Deleted research study protocol: "${existing.title}".`,
      entityId: existing.id,
      entityType: 'Survey',
    });

    res.json({ message: 'Survey deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
