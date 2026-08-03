import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import {
  convertToModelMessages,
  pipeUIMessageStreamToResponse,
  streamText,
  toUIMessageStream,
} from 'ai';
import type { Response } from 'express';
import { AppService } from './app.service.js';
import { RouterService } from './router.service.js';
import { SkipInterceptor } from './skip.decorator.js';

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
    messages: { role: 'assistant' | 'user'; content: string }[],
  ) {
    return this.appService.generateTitle(id, messages);
  }

  @Post('chat')
  @SkipInterceptor()
  async chat(
    @Body()
    body: any,
    @Res() res: Response,
  ) {
    const { messages, system } = body;

    const result = streamText({
      model: this.routerService.router.chatModel('oc/mimo-v2.5-free'),
      messages: await convertToModelMessages(messages),
      system,
    });

    pipeUIMessageStreamToResponse({
      response: res,
      stream: toUIMessageStream({ stream: result.stream }),
    });
  }
}
