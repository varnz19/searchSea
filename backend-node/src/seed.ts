import { PrismaClient } from '@prisma/client';
import { SURVEY_TEMPLATES } from './services/templates';
import { mlClient } from './services/mlClient';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding ResearchOS baseline study...');

  const template = SURVEY_TEMPLATES[0]; // PMF & Feature Utility Study

  // Check if study already exists
  const existing = await prisma.survey.findFirst({
    where: { title: { contains: 'AI Code Assistant' } },
  });

  if (existing) {
    console.log('Baseline study already seeded.');
    return;
  }

  const questionsData = [
    {
      code: 'user_role',
      title: 'What is your primary engineering role / seniority level?',
      type: 'multiple_choice',
      optionsJson: JSON.stringify(['Senior / Lead Engineer', 'Product Manager', 'Data Scientist / Researcher', 'Junior / Mid Developer']),
      orderIndex: 0,
      required: true,
    },
    {
      code: 'cognitive_load_reduction',
      title: 'Using the automated assistant significantly reduces my mental fatigue during research workflows.',
      type: 'likert',
      optionsJson: JSON.stringify({ scaleMin: 1, scaleMax: 5 }),
      orderIndex: 1,
      required: true,
    },
    {
      code: 'trust_in_automation',
      title: 'I trust the automated statistical hypothesis test selections and effect size reports.',
      type: 'likert',
      optionsJson: JSON.stringify({ scaleMin: 1, scaleMax: 5 }),
      orderIndex: 2,
      required: true,
    },
    {
      code: 'workflow_speedup_satisfaction',
      title: 'How satisfied are you with the time saved preprocessing and analyzing 10K+ responses?',
      type: 'likert',
      optionsJson: JSON.stringify({ scaleMin: 1, scaleMax: 5 }),
      orderIndex: 3,
      required: true,
    },
    {
      code: 'weekly_research_hours',
      title: 'How many hours per week do you spend preparing, cleaning, or reporting data?',
      type: 'numeric',
      optionsJson: JSON.stringify({ scaleMin: 1, scaleMax: 60 }),
      orderIndex: 4,
      required: true,
    },
    {
      code: 'open_feedback',
      title: 'What is your primary feedback regarding automated statistical tests and data provenance?',
      type: 'open_ended',
      optionsJson: null,
      orderIndex: 5,
      required: false,
    },
  ];

  const survey = await prisma.survey.create({
    data: {
      title: 'AI Code Assistant: Adoption, Trust & Cognitive Load Study',
      objective: 'Quantify developer cognitive load reduction, trust in automated code synthesis, and NPS across developer seniority tiers.',
      description: 'Comprehensive quantitative study evaluating developer experience and statistical reliability when adopting AI research engines.',
      archetype: 'product_market_fit',
      status: 'ACTIVE',
      questions: {
        create: questionsData,
      },
    },
    include: { questions: true },
  });

  console.log(`Created survey: ${survey.id}`);

  // Generate 250 realistic responses using ML microservice
  try {
    const questionMeta = survey.questions.map((q) => ({
      id: q.code,
      title: q.title,
      type: q.type,
      options: q.optionsJson ? (typeof JSON.parse(q.optionsJson) === 'object' && Array.isArray(JSON.parse(q.optionsJson)) ? JSON.parse(q.optionsJson) : undefined) : undefined,
    }));

    const synth = await mlClient.generateSyntheticData({
      nResponses: 250,
      questions: questionMeta,
      injectAnomalies: true,
    });

    const responseRecords = synth.responses.map((resp) => ({
      surveyId: survey.id,
      respondentId: resp.respondent_id || `usr_${Math.floor(Math.random() * 90000) + 10000}`,
      durationSeconds: resp.duration_seconds || 140.0,
      source: 'synthetic_generator',
      dataJson: JSON.stringify(resp),
    }));

    await prisma.response.createMany({ data: responseRecords });
    console.log(`✅ Ingested ${responseRecords.length} realistic responses for study.`);
  } catch (err: any) {
    console.warn('Could not contact ML service for seed responses:', err.message);
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
