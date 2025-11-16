import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    });

    return response.data[0].embedding;
  }
}
