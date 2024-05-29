import { Injectable, Logger } from '@nestjs/common';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs';
import * as path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import * as tf from '@tensorflow/tfjs-node'; // Ensure tfjs-node is imported
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { ConfigService } from '@nestjs/config';

interface IngestedDocument {
  text: string;
  metadata?: Record<string, any>;
}

interface RawDocument {
  pageContent: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private pineconeClient: Pinecone;
  private index: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('PINECONE_API_KEY');
    const indexName = this.configService.get<string>('PINECONE_INDEX_NAME');
    const indexHost = this.configService.get<string>('PINECONE_INDEX_HOST');

    if (!apiKey || !indexName || !indexHost) {
      this.logger.error('Missing Pinecone configuration');
      throw new Error('Missing Pinecone configuration');
    }

    this.logger.log('Initializing Pinecone client');
    this.pineconeClient = new Pinecone({ apiKey });

    this.logger.log(`Initializing Pinecone index: ${indexName}`);
    this.index = this.pineconeClient.index(indexName);

    this.configureTensorFlow();
  }

  private async configureTensorFlow() {
    this.logger.log('Setting TensorFlow.js backend to tfjs-node');
    await tf.ready();
    await tf.setBackend('tensorflow');
    this.logger.log('TensorFlow.js backend is ready');
  }

  async processAllPdfsInDirectory(directoryPath: string) {
    this.logger.log(`Processing all PDFs in directory: ${directoryPath}`);
    try {
      const files = await fs.promises.readdir(directoryPath);
      const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');

      for (const file of pdfFiles) {
        const filePath = path.join(directoryPath, file);
        await this.processPdf(filePath);
      }

      this.logger.log('All PDFs in directory processed');
      return { message: 'All PDFs in directory processed' };
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error processing PDFs in directory', err.stack);
      throw new Error('Failed to process PDFs in directory');
    }
  }

  async processPdf(filePath: string) {
    this.logger.log(`Processing file: ${filePath}`);

    try {
      await tf.ready();
      const rawDocs = await this.loadPdf(filePath);
      const docs = await this.splitText(rawDocs);

      const model = await use.load();

      const embeddings = await this.createEmbeddings(model, docs);

      const vectors = embeddings.map((embedding, idx) => ({
        id: `vec${idx}`,
        values: Array.from(embedding.dataSync()),
        metadata: {
          text: docs[idx].text,
          source: filePath
        },
      }));

      await this.index.namespace(this.configService.get<string>('PINECONE_NAME_SPACE')).upsert(vectors);

      this.logger.log('Ingestion complete');
      return { message: 'Ingestion complete', vectors };
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error processing PDF', err.stack);
      throw new Error('Failed to process PDF');
    }
  }

  async setMetadata(metadata: { id: string; source: string; text: string; from: number; to: number }) {
    this.logger.log(`Setting metadata for document: ${metadata.id}`);
    
    try {
      const update = {
        id: metadata.id,
        setMetadata: {
          source: metadata.source,
          text: metadata.text,
          loc: {
            lines: {
              from: metadata.from,
              to: metadata.to,
            },
          },
        },
      };

      await this.index.namespace(this.configService.get<string>('PINECONE_NAME_SPACE')).update(update);

      this.logger.log('Metadata update complete');
      return { message: 'Metadata update complete', update };
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error setting metadata', err.stack);
      throw new Error('Failed to set metadata');
    }
  }

  private async loadPdf(filePath: string): Promise<IngestedDocument[]> {
    const pdfLoader = new PDFLoader(filePath);
    const rawDocuments: RawDocument[] = await pdfLoader.load();

    return rawDocuments.map(doc => ({
      text: doc.pageContent,
      metadata: doc.metadata || {},
    }));
  }

  private async splitText(rawDocs: IngestedDocument[]): Promise<IngestedDocument[]> {
    const langChainDocs = rawDocs.map(doc => ({
      pageContent: doc.text,
      metadata: doc.metadata || {},
    }));

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splittedDocs = await textSplitter.splitDocuments(langChainDocs);

    return splittedDocs.map(doc => ({
      text: doc.pageContent,
      metadata: doc.metadata,
    }));
  }

  private async createEmbeddings(model: any, docs: IngestedDocument[]): Promise<tf.Tensor[]> {
    const texts = docs.map(doc => doc.text);
    const embeddings = await model.embed(texts);
    return embeddings.unstack();
  }
}