import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
}
