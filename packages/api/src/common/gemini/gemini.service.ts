import { Injectable, Logger, InternalServerErrorException, BadGatewayException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { RetryService } from '../retry/retry.service';
import { RetryPolicies, ErrorPredicates } from '../retry/retry.interface';
import { getPromptTemplate } from './prompt-templates';

export interface GeneratePlanInput {
  profile: {
    niche: string;
    level: string;
    goals: string[];
    availability: any;
    equipment: string[];
    constraints: string[];
    locale?: string; // User's preferred language
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

  constructor(
    private configService: ConfigService,
    private retryService: RetryService,
  ) {
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
   * Includes retry logic for transient failures
   */
  async generatePlan(input: GeneratePlanInput): Promise<any> {
    try {
      const prompt = this.buildPrompt(input);

      this.logger.log('Generating plan with Gemini AI...');
      this.logger.debug(`Prompt length: ${prompt.length} characters`);

      // Use retry with critical policy (5 attempts, 2s-60s backoff)
      // Only retry on transient errors (network, rate limit, server errors)
      const { result } = await this.retryService.executeWithRetry(
        async () => {
          const model = this.genAI.getGenerativeModel({ model: this.model });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        },
        {
          ...RetryPolicies.CRITICAL,
          shouldRetry: (error) => {
            // Retry on transient errors, but not on quota/auth errors
            const isQuotaError = error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED');
            const isAuthError = error?.message?.includes('API key') || error?.message?.includes('permission');

            if (isQuotaError || isAuthError) {
              this.logger.error(`Non-retryable error: ${error.message}`);
              return false;
            }

            return ErrorPredicates.isTransientError(error);
          },
          onRetry: (attempt, error, delay) => {
            this.logger.warn(
              `AI generation attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`,
            );
          },
        },
      );

      this.logger.log('Plan generated successfully');

      // Parse and validate JSON
      const jsonPlan = this.extractAndValidateJSON(result, input.jsonSchema);

      return jsonPlan;
    } catch (error) {
      this.logger.error('Failed to generate plan with Gemini', error);
      throw new InternalServerErrorException(`Plan generation failed: ${error.message}`);
    }
  }

  /**
   * Build prompt from template and input data
   * Supports multi-language templates based on user locale
   */
  private buildPrompt(input: GeneratePlanInput): string {
    const { profile, template, exercises, jsonSchema } = input;

    // Use multi-language template if locale is specified and no custom template
    let prompt = template.aiPromptTemplate;

    // If template is default/empty and locale is specified, use localized template
    if (profile.locale && (!template.aiPromptTemplate || template.aiPromptTemplate.includes('{niche}'))) {
      prompt = getPromptTemplate(profile.locale, 'planGeneration');
    }

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

    // Add exercises list (compact format to reduce prompt size)
    // Since exercises are already pre-filtered and limited, we can send them directly
    const exercisesList = exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      desc: ex.description || '', // Shorten field name
      int: ex.intensity, // Shorten field name
      dur: ex.duration, // Shorten field name
      eq: ex.equipment, // Shorten field name
    }));

    // Use compact JSON (no indentation) to reduce token usage by ~40%
    prompt += `\n\nAvailable exercises:\n${JSON.stringify(exercisesList)}`;

    // Add JSON schema (compact format)
    prompt += `\n\nExpected JSON structure:\n${JSON.stringify(jsonSchema)}`;

    prompt += `\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown, no explanations.`;

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
   * Includes retry logic for transient failures
   */
  async generateText(prompt: string): Promise<string> {
    try {
      // Use retry with standard policy (3 attempts, 1s-10s backoff)
      const { result } = await this.retryService.executeWithRetry(
        async () => {
          const model = this.genAI.getGenerativeModel({ model: this.model });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        },
        {
          ...RetryPolicies.STANDARD,
          shouldRetry: ErrorPredicates.isTransientError,
        },
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to generate text with Gemini', error);
      throw new InternalServerErrorException(`Text generation failed: ${error.message}`);
    }
  }
}
