import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RouterService {
  readonly router = createOpenAICompatible({
    baseURL: `${process.env.LLM_API_ENDPOINT}/v1`,
    apiKey: process.env.LLM_API_KEY || '',
    name: 'customrouter',
  });
}
