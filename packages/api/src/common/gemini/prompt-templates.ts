/**
 * Multi-language AI Prompt Templates
 * Supports: Portuguese (pt-BR), English (en-US), Spanish (es-ES)
 */

export const PROMPT_TEMPLATES = {
  'pt-BR': {
    systemInstructions: `Você é um assistente especializado em criar planos de treino personalizados.
Analise cuidadosamente o perfil do usuário e crie um plano estruturado, progressivo e adaptado às suas necessidades.`,

    planGeneration: `Crie um plano de {plan_length} semanas para {niche}, nível {level}.

Perfil do Usuário:
- Objetivos: {goals}
- Disponibilidade: {availability}
- Equipamentos: {equipment}
- Restrições: {constraints}

Regras:
- Máximo {max_high_intensity_per_week} treinos de alta intensidade por semana
- Mínimo {min_rest_days} dias de descanso por semana

Exercícios Disponíveis:
{exercises}

IMPORTANTE: Responda APENAS com JSON válido seguindo esta estrutura:
{schema}`,

    adjustmentPrompt: `Ajuste o plano de treino baseado no feedback do usuário:
Feedback: {feedback}
Avaliação: {rating}/5
Dificuldade percebida: {difficulty}

Ajuste mantendo a progressão mas considerando o feedback.`,
  },

  'en-US': {
    systemInstructions: `You are an expert assistant in creating personalized training plans.
Carefully analyze the user's profile and create a structured, progressive plan adapted to their needs.`,

    planGeneration: `Create a {plan_length}-week plan for {niche}, level {level}.

User Profile:
- Goals: {goals}
- Availability: {availability}
- Equipment: {equipment}
- Constraints: {constraints}

Rules:
- Maximum {max_high_intensity_per_week} high-intensity workouts per week
- Minimum {min_rest_days} rest days per week

Available Exercises:
{exercises}

IMPORTANT: Respond ONLY with valid JSON following this structure:
{schema}`,

    adjustmentPrompt: `Adjust the training plan based on user feedback:
Feedback: {feedback}
Rating: {rating}/5
Perceived difficulty: {difficulty}

Adjust while maintaining progression but considering the feedback.`,
  },

  'es-ES': {
    systemInstructions: `Eres un asistente experto en crear planes de entrenamiento personalizados.
Analiza cuidadosamente el perfil del usuario y crea un plan estructurado, progresivo y adaptado a sus necesidades.`,

    planGeneration: `Crea un plan de {plan_length} semanas para {niche}, nivel {level}.

Perfil del Usuario:
- Objetivos: {goals}
- Disponibilidad: {availability}
- Equipamiento: {equipment}
- Restricciones: {constraints}

Reglas:
- Máximo {max_high_intensity_per_week} entrenamientos de alta intensidad por semana
- Mínimo {min_rest_days} días de descanso por semana

Ejercicios Disponibles:
{exercises}

IMPORTANTE: Responde SOLO con JSON válido siguiendo esta estructura:
{schema}`,

    adjustmentPrompt: `Ajusta el plan de entrenamiento basándote en la retroalimentación del usuario:
Retroalimentación: {feedback}
Calificación: {rating}/5
Dificultad percibida: {difficulty}

Ajusta manteniendo la progresión pero considerando la retroalimentación.`,
  },
};

export type SupportedLocale = keyof typeof PROMPT_TEMPLATES;

export function getPromptTemplate(locale: string, templateKey: keyof typeof PROMPT_TEMPLATES['pt-BR']): string {
  const supportedLocale = (locale as SupportedLocale) || 'pt-BR';

  // Fallback to pt-BR if locale not supported
  if (!PROMPT_TEMPLATES[supportedLocale]) {
    return PROMPT_TEMPLATES['pt-BR'][templateKey];
  }

  return PROMPT_TEMPLATES[supportedLocale][templateKey];
}
