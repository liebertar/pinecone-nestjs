import { Injectable } from '@nestjs/common';
import { pinecone } from './pinecone-client';
import { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';

@Injectable()
export class PineconeService {
  async addEmbedding(embedding: PineconeRecord<RecordMetadata>) {
    if (!pinecone) {
      throw new Error('Pinecone Client is not initialized');
    }

    try {
      const indexName = process.env.PINECONE_INDEX_NAME!;
      const index = pinecone!.Index(indexName);

      // Correct structure for upsert
      const upsertData: Array<PineconeRecord<RecordMetadata>> = [
        {
          id: embedding.id,
          values: embedding.values,
          metadata: embedding.metadata || {},
        },
      ];

      // Directly upserting the array of PineconeRecord
      await index.upsert(upsertData);

      return { status: 'success' };
    } catch (error) {
      console.error('Error adding embedding:', error);
      throw new Error('Error adding embedding');
    }
  }
}
