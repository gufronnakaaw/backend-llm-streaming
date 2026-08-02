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
