import { tool } from 'ai';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from 'docx';
import { writeFile } from 'fs/promises';
import { z } from 'zod';
import { SearchResult } from './app.type.js';

const blockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('heading'),
    level: z.enum(['1', '2', '3']),
    text: z.string(),
  }),
  z.object({
    type: z.literal('paragraph'),
    text: z.string(),
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
  }),
  z.object({ type: z.literal('bulletList'), items: z.array(z.string()) }),
  z.object({
    type: z.literal('table'),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
]);

const HEADING_MAP = {
  '1': HeadingLevel.HEADING_1,
  '2': HeadingLevel.HEADING_2,
  '3': HeadingLevel.HEADING_3,
};

export const generateDocx = tool({
  description: 'Generate a .docx file from structured content blocks',
  inputSchema: z.object({
    filename: z.string(),
    blocks: z.array(blockSchema),
  }),
  execute: async ({
    filename,
    blocks,
  }: {
    filename: string;
    blocks: z.infer<typeof blockSchema>[];
  }) => {
    try {
      const children = blocks.flatMap((b) => {
        switch (b.type) {
          case 'heading':
            return new Paragraph({
              text: b.text,
              heading: HEADING_MAP[b.level],
            });
          case 'paragraph':
            return new Paragraph({
              children: [
                new TextRun({ text: b.text, bold: b.bold, italics: b.italic }),
              ],
            });
          case 'bulletList':
            return b.items.map(
              (item) => new Paragraph({ text: item, bullet: { level: 0 } }),
            );
          case 'table':
            return new Table({
              rows: [b.headers, ...b.rows].map(
                (row) =>
                  new TableRow({
                    children: row.map(
                      (cell) =>
                        new TableCell({ children: [new Paragraph(cell)] }),
                    ),
                  }),
              ),
            });
        }
      });

      const doc = new Document({ sections: [{ children }] });
      const buffer = await Packer.toBuffer(doc);
      const path = `./output/${filename}`;
      await writeFile(path, buffer);
      return { path }; // atau upload ke S3/return signed URL kalau butuh diakses user
    } catch (error) {
      console.log(error);
      return {
        error: 'Failed to generate .docx file. Please check the input format.',
      };
    }
  },
});

export const webSearch = tool({
  description: 'Search the web for current information',
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ query }: { query: string }) => {
    try {
      const res = await fetch(`https://api.tavily.com/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        },
        body: JSON.stringify({
          query,
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
    } catch (error) {
      console.error('Error during web search:', error);
      return {
        results: [],
        error: 'Search failed. Try a different query or ask again in a moment.',
      };
    }
  },
});
