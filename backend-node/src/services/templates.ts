import { SurveyTemplate } from '../types';

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: 'pmf_validation',
    title: 'Product-Market Fit & Feature Utility Study',
    archetype: 'product_market_fit',
    description: 'Measures core value proposition, Sean Ellis PMF score, feature satisfaction, and friction points.',
    suggestedQuestions: [
      {
        code: 'pmf_disappointment',
        title: 'How would you feel if you could no longer use this platform?',
        type: 'multiple_choice',
        options: ['Very disappointed', 'Somewhat disappointed', 'Not disappointed (it isn’t really useful)', 'N/A - No longer use it'],
        required: true,
      },
      {
        code: 'satisfaction_overall',
        title: 'Overall, how satisfied are you with the platform’s performance?',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'ease_of_use',
        title: 'The platform is intuitive and straightforward to navigate.',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'speed_satisfaction',
        title: 'How satisfied are you with the execution speed and response times?',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'user_role',
        title: 'What best describes your primary role / seniority level?',
        type: 'multiple_choice',
        options: ['Senior / Lead Engineer', 'Product Manager', 'Data Scientist / Researcher', 'Executive / Founder', 'Student / Individual'],
        required: true,
      },
      {
        code: 'weekly_usage_hours',
        title: 'Approximately how many hours per week do you spend on the platform?',
        type: 'numeric',
        scaleMin: 0,
        scaleMax: 80,
        required: true,
      },
      {
        code: 'open_feedback',
        title: 'What is the single most valuable capability, or the biggest bottleneck you experience?',
        type: 'open_ended',
        required: false,
      }
    ]
  },
  {
    id: 'csat_ces_nps',
    title: 'Customer Satisfaction (CSAT) & Effort Score (CES)',
    archetype: 'csat',
    description: 'Comprehensive benchmark for post-interaction satisfaction, customer effort score, and likelihood to recommend.',
    suggestedQuestions: [
      {
        code: 'nps_score',
        title: 'How likely are you to recommend our platform to a peer or colleague? (1 = Not at all, 10 = Extremely likely)',
        type: 'numeric',
        scaleMin: 1,
        scaleMax: 10,
        required: true,
      },
      {
        code: 'csat_quality',
        title: 'How would you rate the overall quality of the service delivered?',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'effort_score',
        title: 'The organization made it easy for me to achieve my primary goal.',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'support_responsiveness',
        title: 'The team answered my questions and resolved issues in a timely manner.',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'customer_tier',
        title: 'What is your current subscription or partnership tier?',
        type: 'multiple_choice',
        options: ['Free / Community', 'Professional Tier', 'Enterprise Tier', 'Beta Partner'],
        required: true,
      },
      {
        code: 'open_feedback',
        title: 'What specific improvement would make your experience significantly better?',
        type: 'open_ended',
        required: false,
      }
    ]
  },
  {
    id: 'academic_behavioral',
    title: 'Cognitive Load & AI Adoption Behavioral Study',
    archetype: 'behavioral',
    description: 'Evaluates perceived trustworthiness, automation bias, cognitive load, and human-AI interaction dynamics.',
    suggestedQuestions: [
      {
        code: 'trust_in_automation',
        title: 'I trust the automated statistical recommendations produced by the AI engine.',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'cognitive_effort_reduction',
        title: 'Using the automated pipeline significantly reduced my mental workload.',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'transparency_clarity',
        title: 'The data provenance and audit logs make the AI decisions explainable and verifiable.',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'domain_expertise',
        title: 'What is your level of prior experience with quantitative research methods?',
        type: 'multiple_choice',
        options: ['Novice (No formal training)', 'Intermediate (Academic coursework)', 'Advanced (Practicing researcher / Data Scientist)'],
        required: true,
      },
      {
        code: 'open_feedback',
        title: 'Share any observations regarding trust, control, or confusion during the analysis workflow.',
        type: 'open_ended',
        required: false,
      }
    ]
  },
  {
    id: 'employee_engagement',
    title: 'Employee Engagement & Organizational Culture',
    archetype: 'employee',
    description: 'Assesses overall job satisfaction, psychological safety, manager trust, growth opportunity perception, and organizational alignment.',
    suggestedQuestions: [
      {
        code: 'job_satisfaction',
        title: 'How satisfied are you with your overall work experience at this organization?',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'manager_trust',
        title: 'My direct manager genuinely cares about my professional growth and well-being.',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'psychological_safety',
        title: 'I feel comfortable voicing disagreements or raising concerns without fear of negative consequences.',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'growth_opportunity',
        title: 'The organization provides meaningful opportunities for career advancement and skill development.',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'team_collaboration',
        title: 'Cross-functional collaboration within my team is effective and well-supported.',
        type: 'likert',
        scaleMin: 1,
        scaleMax: 5,
        required: true,
      },
      {
        code: 'department',
        title: 'Which department or function do you belong to?',
        type: 'multiple_choice',
        options: ['Engineering', 'Product / Design', 'Marketing / Sales', 'Operations / HR', 'Executive / Leadership'],
        required: true,
      },
      {
        code: 'open_feedback',
        title: 'What is the single most impactful change leadership could make to improve your day-to-day experience?',
        type: 'open_ended',
        required: false,
      }
    ]
  }
];
