import { PrismaClient } from '@prisma/client';
import { authService } from './services/authService';
import { mlClient } from './services/mlClient';
import { activityService } from './services/activityService';
import axios from 'axios';

const prisma = new PrismaClient();

async function runSeed() {
  console.log('🌱 Seeding SearchSea Rich Baseline Demonstration Environment...\n');

  // 1. Create or reset demo user
  const email = 'demo@searchsea.io';
  const password = 'Password123!';
  const passwordHash = await authService.hashPassword(password);

  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.delete({ where: { email } });
  }

  user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Dr. Eleanor Vance',
      username: 'dr_vance',
      institution: 'University of Oxford, Department of Computer Science',
      discipline: 'Quantitative Behavioral Science, Human-AI Interaction',
      orcidId: '0000-0002-1825-0097',
      bio: 'Investigates cognitive load reduction in high-concurrency research workflows, algorithmic transparency trust, and automated multiple-comparisons family-wise error control.',
      settingsJson: JSON.stringify({
        defaultAlpha: 0.05,
        defaultCorrectionMethod: 'bonferroni',
        speederDurationCutoffSeconds: 15,
        straightlineStdThreshold: 0.35,
        entropyCutoffThreshold: 2.5,
        reportingNotationStyle: 'apa_7th',
        autoRunPipelineOnIngest: true,
      }),
    },
  });

  console.log(`✅ Demo User Created: ${user.email} (Password: ${password})`);

  // 2. Create Primary Study: "Cognitive Load & Algorithmic Trust Study"
  const study1Questions = [
    {
      code: 'user_segment',
      title: 'What is your primary engineering experience level / seniority tier?',
      type: 'multiple_choice',
      optionsJson: JSON.stringify(['Senior / Principal Engineer', 'Mid-Level Researcher', 'Data Scientist', 'Junior / Associate Developer']),
      orderIndex: 0,
      required: true,
    },
    {
      code: 'cognitive_effort_reduction',
      title: 'Automated statistical test selection significantly reduces my mental fatigue when conducting research.',
      type: 'likert',
      optionsJson: JSON.stringify({ scaleMin: 1, scaleMax: 5 }),
      orderIndex: 1,
      required: true,
    },
    {
      code: 'trust_in_automation',
      title: 'I trust automated multiple-testing adjustments (Bonferroni & Benjamini-Hochberg FDR) over manual calculations.',
      type: 'likert',
      optionsJson: JSON.stringify({ scaleMin: 1, scaleMax: 5 }),
      orderIndex: 2,
      required: true,
    },
    {
      code: 'transparency_clarity',
      title: 'Having an immutable data provenance audit trail increases my confidence in publishing findings.',
      type: 'likert',
      optionsJson: JSON.stringify({ scaleMin: 1, scaleMax: 5 }),
      orderIndex: 3,
      required: true,
    },
    {
      code: 'weekly_data_hours',
      title: 'On average, how many hours per week do you spend preparing, cleaning, or running statistical tests?',
      type: 'numeric',
      optionsJson: JSON.stringify({ scaleMin: 1, scaleMax: 60 }),
      orderIndex: 4,
      required: true,
    },
    {
      code: 'qualitative_feedback',
      title: 'What is your primary feedback regarding automated statistical tests and data provenance in research workflows?',
      type: 'open_ended',
      optionsJson: null,
      orderIndex: 5,
      required: false,
    },
  ];

  const survey1 = await prisma.survey.create({
    data: {
      userId: user.id,
      title: 'Developer Experience: Cognitive Load & Algorithmic Trust in Automated Research',
      objective: 'Evaluate whether senior engineers experience significantly lower cognitive load and higher trust when using automated statistical testing tools compared to junior developers.',
      description: 'Multi-institutional quantitative study measuring developer productivity, cognitive fatigue reduction, and algorithmic trust in automated statistical engines.',
      archetype: 'product_market_fit',
      status: 'ACTIVE',
      questions: {
        create: study1Questions,
      },
    },
    include: { questions: true },
  });

  console.log(`✅ Created Study 1: "${survey1.title}" (${survey1.id})`);

  // 3. Ingest 350 Responses with speeders and straight-liners
  const questionMeta1 = survey1.questions.map((q) => ({
    id: q.code,
    title: q.title,
    type: q.type,
    options: q.optionsJson ? (typeof JSON.parse(q.optionsJson) === 'object' && Array.isArray(JSON.parse(q.optionsJson)) ? JSON.parse(q.optionsJson) : undefined) : undefined,
  }));

  const synth1 = await mlClient.generateSyntheticData({
    nResponses: 350,
    questions: questionMeta1,
    injectAnomalies: true,
  });

  const responseRecords1 = synth1.responses.map((resp) => ({
    surveyId: survey1.id,
    respondentId: resp.respondent_id || `usr_${Math.floor(Math.random() * 90000) + 10000}`,
    durationSeconds: resp.duration_seconds || 135.0,
    source: 'synthetic_generator',
    dataJson: JSON.stringify(resp),
  }));

  for (let i = 0; i < responseRecords1.length; i += 100) {
    await prisma.response.createMany({ data: responseRecords1.slice(i, i + 100) });
  }
  console.log(`✅ Ingested ${responseRecords1.length} respondent records into Study 1.`);

  // 4. Execute Full Automated Pipeline on Study 1
  const token = authService.generateToken({ userId: user.id, email: user.email });
  const runRes = await axios.post(
    `http://localhost:5000/api/analysis/run/${survey1.id}`,
    { runName: 'Baseline Empirical Pipeline Run #01' },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log(`✅ Pipeline executed on Study 1! Run ID: ${runRes.data.runId} (${runRes.data.cleanResponses} clean records).`);

  // 5. Create Study 2: "Enterprise CSAT & NPS Benchmark"
  const survey2 = await prisma.survey.create({
    data: {
      userId: user.id,
      title: 'Enterprise Customer Satisfaction (CSAT) & Retention Drivers',
      objective: 'Measure customer effort score (CES), Net Promoter Score (NPS), and feature satisfaction across tier levels.',
      description: 'Quarterly quantitative customer benchmark across Enterprise and Growth subscription cohorts.',
      archetype: 'csat_ces_nps',
      status: 'ACTIVE',
      questions: {
        create: [
          {
            code: 'subscription_tier',
            title: 'What is your current subscription plan tier?',
            type: 'multiple_choice',
            optionsJson: JSON.stringify(['Enterprise Academic', 'Enterprise Standard', 'Professional Lab', 'Individual Researcher']),
            orderIndex: 0,
            required: true,
          },
          {
            code: 'csat_score',
            title: 'Overall, how satisfied are you with the statistical reliability of the research engine?',
            type: 'likert',
            optionsJson: JSON.stringify({ scaleMin: 1, scaleMax: 5 }),
            orderIndex: 1,
            required: true,
          },
          {
            code: 'customer_effort_score',
            title: 'The platform made it easy for me to analyze high-volume datasets without manual spreadsheet wrangling.',
            type: 'likert',
            optionsJson: JSON.stringify({ scaleMin: 1, scaleMax: 5 }),
            orderIndex: 2,
            required: true,
          },
          {
            code: 'nps_likelihood',
            title: 'How likely are you to recommend SearchSea to a peer or research colleague? (0 to 10)',
            type: 'numeric',
            optionsJson: JSON.stringify({ scaleMin: 0, scaleMax: 10 }),
            orderIndex: 3,
            required: true,
          },
        ],
      },
    },
    include: { questions: true },
  });

  const questionMeta2 = survey2.questions.map((q) => ({
    id: q.code,
    title: q.title,
    type: q.type,
    options: q.optionsJson ? (typeof JSON.parse(q.optionsJson) === 'object' && Array.isArray(JSON.parse(q.optionsJson)) ? JSON.parse(q.optionsJson) : undefined) : undefined,
  }));

  const synth2 = await mlClient.generateSyntheticData({
    nResponses: 150,
    questions: questionMeta2,
    injectAnomalies: true,
  });

  const responseRecords2 = synth2.responses.map((resp) => ({
    surveyId: survey2.id,
    respondentId: resp.respondent_id || `usr_${Math.floor(Math.random() * 90000) + 10000}`,
    durationSeconds: resp.duration_seconds || 110.0,
    source: 'google_forms',
    dataJson: JSON.stringify(resp),
  }));

  for (let i = 0; i < responseRecords2.length; i += 100) {
    await prisma.response.createMany({ data: responseRecords2.slice(i, i + 100) });
  }
  console.log(`✅ Created & Ingested Study 2 with ${responseRecords2.length} responses.`);

  // 6. Record Historical Activity Logs
  await activityService.log({
    userId: user.id,
    action: 'STUDY_CREATED',
    details: `Created new quantitative study protocol: "${survey1.title}".`,
    entityId: survey1.id,
    entityType: 'Survey',
  });

  await activityService.log({
    userId: user.id,
    action: 'DATA_INGESTED',
    details: `Ingested 350 responses with speeder/straight-lining anomaly detection into "${survey1.title}".`,
    entityId: survey1.id,
    entityType: 'Survey',
  });

  await activityService.log({
    userId: user.id,
    action: 'PIPELINE_EXECUTED',
    details: `Executed full empirical pipeline (Welch's t, ANOVA, Bonferroni correction, 2D PCA, K-Means clustering, and NLP theme extraction).`,
    entityId: runRes.data.runId,
    entityType: 'AnalysisRun',
  });

  console.log('\n🎉 SearchSea Demonstration Environment Successfully Seeded!');
  console.log('---------------------------------------------------------');
  console.log('Web App URL:       http://localhost:3000');
  console.log('Demo Login Email:  demo@searchsea.io');
  console.log('Demo Password:     Password123!');
  console.log('Database GUI:      http://localhost:5555 (Prisma Studio)');
  console.log('Python API Docs:   http://localhost:8000/docs');
  console.log('---------------------------------------------------------\n');
}

runSeed()
  .catch((err) => {
    console.error('Seed error:', err.response?.data || err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
