import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import {
  convertToModelMessages,
  pipeUIMessageStreamToResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from 'ai';
import type { Response } from 'express';
import { AppService } from './app.service.js';
import type { ChatCompletionBody } from './app.type.js';
import { resolveReasoningEffort } from './models.js';
import { RouterService } from './router.service.js';
import { SkipInterceptor } from './skip.decorator.js';
import { webSearch } from './tools.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly routerService: RouterService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('threads')
  getThreads() {
    return this.appService.getThreads();
  }

  @Get('threads/:id')
  getThreadById(@Param('id') id: string) {
    return this.appService.getThreadById(id);
  }

  @Post('threads')
  createThread() {
    return this.appService.createThread('New Chat');
  }

  @Delete('threads/:id')
  deleteThread(@Param('id') id: string) {
    return this.appService.deleteThread(id);
  }

  @Patch('threads/:id')
  updateThread(
    @Param('id') id: string,
    @Body() body: { title: string; status: 'regular' | 'archived' },
  ) {
    return this.appService.updateThread(id, body);
  }

  @Get('threads/:id/messages')
  getThreadMessages(@Param('id') id: string) {
    return this.appService.getThreadMessages(id);
  }

  @Post('threads/:id/messages')
  createMessage(
    @Param('id') id: string,
    @Body()
    body: { id: string; parent_id?: string; format: string; content: string },
  ) {
    return this.appService.createThreadMessage(id, body);
  }

  @Post('threads/:id/title')
  async generateTitle(
    @Param('id') id: string,
    @Body()
    body: { messages: { role: 'assistant' | 'user'; content: string }[] },
  ) {
    return this.appService.generateTitle(id, body.messages);
  }

  @Post('chat')
  @SkipInterceptor()
  async chat(
    @Body()
    body: ChatCompletionBody,
    @Res() res: Response,
  ) {
    const { messages, metadata } = body;

    const config = resolveReasoningEffort(
      body.config.modelName,
      body.config.reasoningEffort,
    );

    const route = createOpenAICompatible({
      baseURL: config.api_url as string,
      apiKey: config.api_key,
      name: 'dynamicRouter',
    });

    const sanitizedMessages = metadata?.custom?.search
      ? messages
      : messages.map((m) => ({
          ...m,
          parts:
            m.parts?.filter((p) => !p.type?.startsWith('tool-')) ?? m.parts,
        }));

    const result = streamText({
      model: route.chatModel(config.id),
      messages: await convertToModelMessages(sanitizedMessages),
      system: `
      Available tools: ${metadata?.custom?.search ? 'webSearch' : 'none'}.

      If tools is unavailable, answer normally.
      Never emit tool calls or tool request syntax. 
      
      Formatting Rules: - For all mathematical expressions, always use double dollar-sign delimiters. - Use $$...$$ for every mathematical expression, including expressions that would normally be written inline. - Never use single-dollar delimiters. - Never use \\(...\\) or \\[...\\] delimiters. - When writing mathematical expressions inside strings, treat $$ as literal text and escape it when required by the target language to prevent interpolation, templating, formatting, or parsing errors.`,
      tools: {
        ...(metadata?.custom?.search ? { webSearch } : {}),
      },
      providerOptions: {
        dynamicRouter: {
          reasoning_effort: config.effort,
        },
      },
      stopWhen: stepCountIs(5),
    });

    void pipeUIMessageStreamToResponse({
      response: res,
      stream: toUIMessageStream({ stream: result.stream }),
    });
  }
}
