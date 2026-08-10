import { UIMessage } from 'ai';

export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
      reasoning?: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionBody {
  messages: UIMessage[];
  metadata: {
    custom: {
      search_depth: number;
      search: boolean;
    };
  };
  config: {
    modelName: string;
  };
}

export interface SearchResult {
  query: string;
  follow_up_questions: any;
  answer: any;
  images: any[];
  results: {
    url: string;
    title: string;
    content: string;
    score: number;
    raw_content: any;
    favicon: string;
    id: string;
  }[];
  response_time: number;
  request_id: string;
}
