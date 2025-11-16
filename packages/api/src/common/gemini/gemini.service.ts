import { Injectable, Logger, InternalServerErrorException, BadGatewayException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new Error(
        'GEMINI_API_KEY is required but not configured. ' +
        'Please set a valid Gemini API key in your .env file. ' +
        'Get your API key from: https://makersuite.google.com/app/apikey'
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-pro';
    this.logger.log(`Gemini AI initialized with model: ${this.model}`);
  }

  /**
   * Generate a personalized plan using Gemini AI
   */
  async generatePlan(input: GeneratePlanInput): Promise<any> {
    try {
      const prompt = this.buildPrompt(input);

      this.logger.log('Generating plan with Gemini AI...');
      this.logger.debug(`Prompt length: ${prompt.length} characters`);

      const model = this.genAI.getGenerativeModel({ model: this.model });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.logger.log('Plan generated successfully');

      // Parse and validate JSON
      const jsonPlan = this.extractAndValidateJSON(text, input.jsonSchema);

      return jsonPlan;
    } catch (error) {
      this.logger.error('Failed to generate plan with Gemini', error);
      throw new InternalServerErrorException(`Plan generation failed: ${error.message}`);
    }
  }

  /**
   * Build prompt from template and input data
   */
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

    // Add JSON schema
    prompt += `\n\nJSON Schema:\n${JSON.stringify(jsonSchema, null, 2)}`;

    prompt += `\n\nIMPORTANT: Respond ONLY with valid JSON. No explanations or additional text.`;

    return prompt;
  }

  /**
   * Extract JSON from response and validate against schema
   */
  private extractAndValidateJSON(text: string, schema: any): any {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);

    let jsonText = jsonMatch ? jsonMatch[1] : text;

    // Remove any leading/trailing whitespace
    jsonText = jsonText.trim();

    try {
      const parsed = JSON.parse(jsonText);

      // Basic validation (you can add more sophisticated validation here)
      if (!parsed || typeof parsed !== 'object') {
        throw new BadGatewayException('Invalid JSON structure from AI service');
      }

      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse JSON from Gemini response');
      this.logger.debug('Response text:', text);
      throw new BadGatewayException('AI service returned invalid JSON format');
    }
  }

  /**
   * Generate text completion (for general AI tasks)
   */
  async generateText(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Failed to generate text with Gemini', error);
      throw new InternalServerErrorException(`Text generation failed: ${error.message}`);
    }
  }
}
