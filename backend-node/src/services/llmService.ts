import axios from 'axios';
import { QuestionDefinition, SurveyTemplate } from '../types';
import { SURVEY_TEMPLATES } from './templates';

export interface RefineSurveyInput {
  objective: string;
  templateId?: string;
  targetAudience?: string;
}

export interface RefinedSurveyOutput {
  title: string;
  description: string;
  archetype: string;
  questions: QuestionDefinition[];
  refinementSource: 'claude_api' | 'intelligent_synthesizer';
}

export async function generateRefinedSurvey(input: RefineSurveyInput): Promise<RefinedSurveyOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 1. Select matching template
  let baseTemplate = SURVEY_TEMPLATES[0];
  if (input.templateId) {
    const found = SURVEY_TEMPLATES.find((t) => t.id === input.templateId);
    if (found) baseTemplate = found;
  } else {
    // Basic heuristic match based on objective keywords
    const objLower = input.objective.toLowerCase();
    if (objLower.includes('satisfaction') || objLower.includes('nps') || objLower.includes('csat') || objLower.includes('support')) {
      baseTemplate = SURVEY_TEMPLATES.find((t) => t.id === 'csat_ces_nps') || SURVEY_TEMPLATES[0];
    } else if (objLower.includes('academic') || objLower.includes('cognitive') || objLower.includes('trust') || objLower.includes('behavior')) {
      baseTemplate = SURVEY_TEMPLATES.find((t) => t.id === 'academic_behavioral') || SURVEY_TEMPLATES[0];
    }
  }

  // 2. If Anthropic API key is provided, call Claude 3.5 Sonnet
  if (apiKey && apiKey.startsWith('sk-ant-')) {
    try {
      const prompt = `You are an expert quantitative research methodologist.
Given the researcher objective: "${input.objective}"
Target Audience: "${input.targetAudience || 'General Practitioners'}"
Base Template Archetype: "${baseTemplate.title}"

Refine the survey questions so that they directly measure the stated objective with rigorous Likert scales (1-5), multiple-choice demographic/segmentation variables, and insightful open-ended probes.

Respond ONLY with a valid JSON object matching this schema:
{
  "title": "Clear survey title",
  "description": "Short 1-2 sentence description for respondents",
  "archetype": "${baseTemplate.archetype}",
  "questions": [
    {
      "code": "unique_variable_key_like_q1_satisfaction",
      "title": "Exact question text",
      "type": "likert | multiple_choice | numeric | open_ended",
      "options": ["Option A", "Option B"],
      "scaleMin": 1,
      "scaleMax": 5,
      "required": true
    }
  ]
}`;

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const content = response.data?.content?.[0]?.text;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            title: parsed.title || `${baseTemplate.title} (Refined)`,
            description: parsed.description || input.objective,
            archetype: parsed.archetype || baseTemplate.archetype,
            questions: parsed.questions || baseTemplate.suggestedQuestions,
            refinementSource: 'claude_api',
          };
        }
      }
    } catch (err: any) {
      console.warn('Anthropic API refinement failed or timed out, falling back to intelligent synthesizer:', err.message);
    }
  }

  // 3. Fallback: Intelligent Deterministic Synthesizer tailored to the objective
  const topic = input.objective.trim() || 'Product & User Experience Study';
  const customTitle = topic.length > 50 ? `${topic.substring(0, 47)}...` : topic;

  // Adapt questions dynamically
  const refinedQuestions: QuestionDefinition[] = baseTemplate.suggestedQuestions.map((q, idx) => {
    if (q.type === 'likert' && idx === 1) {
      return {
        ...q,
        title: `Overall, this tool/workflow effectively fulfills my requirements for: "${topic}".`,
      };
    }
    if (q.type === 'open_ended') {
      return {
        ...q,
        title: `What is your primary feedback, friction point, or suggestion regarding: "${topic}"?`,
      };
    }
    return q;
  });

  return {
    title: customTitle,
    description: `Automated quantitative study tailored to evaluate: ${topic}`,
    archetype: baseTemplate.archetype,
    questions: refinedQuestions,
    refinementSource: 'intelligent_synthesizer',
  };
}
