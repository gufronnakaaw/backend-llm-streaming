import { Injectable } from '@nestjs/common';
import { ChatCompletionResponse, SearchResult } from './app.type.js';
import { PrismaService } from './prisma.service.js';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getThreads() {
    return this.prisma.thread.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  getThreadById(id: string) {
    return this.prisma.thread.findUnique({
      where: {
        id,
      },
    });
  }

  createThread(title: string) {
    return this.prisma.thread.create({
      data: {
        userId: 'anonymous',
        title,
      },
      select: {
        id: true,
      },
    });
  }

  updateThread(id: string, title: string) {
    return this.prisma.thread.update({
      where: { id },
      data: { title },
      select: {
        id: true,
        title: true,
      },
    });
  }

  deleteThread(id: string) {
    return this.prisma.thread.delete({
      where: { id },
      select: {
        id: true,
      },
    });
  }

  getThreadMessages(threadId: string) {
    return this.prisma.message.findMany({
      where: { threadId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  createThreadMessage(
    threadId: string,
    body: { id: string; parent_id?: string; format: string; content: string },
  ) {
    return this.prisma.message.create({
      data: {
        id: body.id,
        threadId,
        parentId: body.parent_id,
        format: body.format,
        content: body.content,
      },
      select: {
        id: true,
      },
    });
  }

  async generateTitle(
    threadId: string,
    messages: { role: 'assistant' | 'user'; content: string }[],
  ) {
    const lastUserMessage = messages
      .toReversed()
      .find((m) => m.role === 'user');

    const res = await fetch(
      `${process.env.LLM_API_ENDPOINT}/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'kc/nvidia/nemotron-3-super-120b-a12b:free',
          messages: [
            {
              role: 'system',
              content:
                'Generate a very short title (max 5 words) for this conversation. Output must match the regex ^[A-Za-z ]+$ and contain no other characters. Return only the title.',
            },
            { role: 'user', content: lastUserMessage?.content ?? '' },
          ],
          stream: false,
          reasoning: { enabled: false },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Request failed (${res.status}): ${errText}`);
    }

    const result = (await res.json()) as ChatCompletionResponse;
    const text = result?.choices?.[0]?.message?.content;

    const title = text?.trim() || 'New Chat';

    return this.prisma.thread.update({
      where: { id: threadId },
      data: { title },
      select: {
        id: true,
        title: true,
      },
    });
  }

  async webSearch(query: string, search_depth: number) {
    const res = await fetch(`https://api.tavily.com/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth,
        include_favicon: true,
        max_results: 5,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Request failed (${res.status}): ${errText}`);
    }

    const data: SearchResult = await res.json();

    return {
      answer: data.answer ?? null,
      results: data.results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        favicon: r.favicon,
      })),
    };
  }

  getHello(): string {
    return 'Hello World!';
  }
}
