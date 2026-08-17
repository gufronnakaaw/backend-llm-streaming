import { tool } from 'ai';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

export const createDocxTool = tool({
  description:
    'Membuat dan menyimpan dokumen Microsoft Word (.docx) berdasarkan struktur konten yang diberikan.',

  parameters: z.object({
    title: z.string().describe('Judul utama dokumen (Heading 1)'),
    sections: z
      .array(
        z.object({
          heading: z.string().describe('Judul bagian/sub-judul (Heading 2)'),
          paragraphs: z
            .array(z.string())
            .describe('Paragraf-paragraf isi untuk bagian ini'),
        }),
      )
      .describe('Daftar isi / bagian utama dokumen'),
  }),

  execute: async ({ title, sections }) => {
    try {
      // Menyusun isi dokumen menggunakan library 'docx'
      const docChildren: Paragraph[] = [
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
        }),
      ];

      // Looping data dari LLM untuk membuat sub-judul dan paragraf
      sections?.forEach((section) => {
        docChildren.push(
          new Paragraph({
            text: section.heading,
            heading: HeadingLevel.HEADING_2,
          }),
        );

        section.paragraphs?.forEach((text) => {
          docChildren.push(
            new Paragraph({
              children: [new TextRun(text)],
            }),
          );
        });
      });

      // Membuat instance Dokumen
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      });

      // Mengubah dokumen menjadi Buffer
      const buffer = await Packer.toBuffer(doc);

      // Menyiapkan path untuk menyimpan file
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
      const savePath = path.join(
        process.cwd(),
        'public',
        'downloads',
        fileName,
      );

      // (Opsional) Buat folder jika belum ada
      fs.mkdirSync(path.dirname(savePath), { recursive: true });

      // Simpan file ke server
      fs.writeFileSync(savePath, buffer);

      // Kembalikan response ke LLM
      return {
        success: true,
        message: 'Dokumen berhasil dibuat.',
        fileName: fileName,
        downloadUrl: `https://domain-anda.com/downloads/${fileName}`,
      };
    } catch (error) {
      return { success: false, error: 'Gagal membuat dokumen' };
    }
  },
});
