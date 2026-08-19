export const models = {
  'forgent/deepseek-v4-flash': {
    id: 'deepseek-v4-flash-0731',
    provider: 'deepseek',
    api_key: process.env.LLM_API_KEY,
    api_url: process.env.LLM_API_ENDPOINT + '/v1',
    low: 'low',
    medium: 'medium',
    high: 'high',
  },
  'forgent/gpt-oss-120b': {
    id: 'openai/gpt-oss-120b',
    provider: 'openai',
    api_key: process.env.LLM_GENERATE_TEXT_API_KEY,
    api_url: process.env.LLM_GENERATE_TEXT_API_ENDPOINT + '/v1',
    low: 'low',
    medium: 'medium',
    high: 'high',
  },
};

export function resolveReasoningEffort(
  modelName: 'forgent/deepseek-v4-flash' | 'forgent/gpt-oss-120b',
  effort: 'low' | 'medium' | 'high',
) {
  if (!effort)
    return {
      id: models['forgent/gpt-oss-120b'].id,
      provider: models['forgent/gpt-oss-120b'].provider,
      api_key: models['forgent/gpt-oss-120b'].api_key,
      api_url: models['forgent/gpt-oss-120b'].api_url,
      effort: models['forgent/gpt-oss-120b']['medium'],
    };

  return {
    id: models[modelName].id,
    provider: models[modelName].provider,
    api_key: models[modelName].api_key,
    api_url: models[modelName].api_url,
    effort: models[modelName][effort],
  };
}
