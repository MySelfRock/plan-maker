import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

export interface GeneratePlanInput {
  profile: {
    niche: string;
    level: string;
    goals: string[];
    availability: any;
    equipment: string[];
    constraints: string[];
  };
  template: {
    aiPromptTemplate: string;
    rules: any;
    weeks?: number;
  };
  exercises: any[];
  jsonSchema: any;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('⚠️ GEMINI_API_KEY not set. AI features will not work.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
    this.model = process.env.GEMINI_MODEL || 'gemini-pro';
  }

  async generatePlan(input: GeneratePlanInput): Promise<any> {
    try {
      const prompt = this.buildPrompt(input);

      logger.info('🤖 Generating plan with Gemini AI...');
      logger.debug(`Prompt length: ${prompt.length} characters`);

      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      logger.info('✅ Plan generated successfully by AI');

      const jsonPlan = this.extractAndValidateJSON(text, input.jsonSchema);
      return jsonPlan;
    } catch (error) {
      logger.error('❌ Failed to generate plan with Gemini', error);
      throw new Error(`Plan generation failed: ${error.message}`);
    }
  }

  private buildPrompt(input: GeneratePlanInput): string {
    const { profile, template, exercises, jsonSchema } = input;

    let prompt = template.aiPromptTemplate;

    // Replace placeholders
    prompt = prompt.replace('{niche}', profile.niche);
    prompt = prompt.replace('{level}', profile.level);
    prompt = prompt.replace('{goals}', profile.goals.join(', '));
    prompt = prompt.replace(
      '{availability}',
      `${profile.availability.daysPerWeek} days/week, ${profile.availability.minutesPerDay} minutes/day`,
    );
    prompt = prompt.replace('{equipment}', profile.equipment.join(', ') || 'None');
    prompt = prompt.replace('{constraints}', profile.constraints.join(', ') || 'None');
    prompt = prompt.replace('{plan_length}', template.weeks?.toString() || '12');
    prompt = prompt.replace(
      '{max_high_intensity_per_week}',
      template.rules.maxHighIntensityPerWeek?.toString() || '2',
    );
    prompt = prompt.replace('{min_rest_days}', template.rules.minRestDays?.toString() || '2');

    // Add exercises list
    const exercisesList = exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      description: ex.description,
      intensity: ex.intensity,
      duration: ex.duration,
      equipment: ex.equipment,
    }));

    prompt += `\n\nAvailable exercises (JSON):\n${JSON.stringify(exercisesList, null, 2)}`;
    prompt += `\n\nJSON Schema:\n${JSON.stringify(jsonSchema, null, 2)}`;
    prompt += `\n\nIMPORTANT: Respond ONLY with valid JSON. No explanations or additional text.`;

    return prompt;
  }

  private extractAndValidateJSON(text: string, schema: any): any {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    let jsonText = jsonMatch ? jsonMatch[1] : text;
    jsonText = jsonText.trim();

    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON structure');
      }
      return parsed;
    } catch (error) {
      logger.error('❌ Failed to parse JSON from Gemini response');
      logger.debug('Response text:', text);
      throw new Error('AI returned invalid JSON format');
    }
  }
}
