import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config();

if (
  !process.env.PINECONE_API_KEY ||
  !process.env.PINECONE_INDEX_NAME ||
  !process.env.PINECONE_INDEX_HOST
) {
  throw new Error('Pinecone API key, index name or environment missing');
}

async function initPinecone() {
  try {
    const pinecone = new Pinecone({
      apiKey: JSON.stringify(process.env.PINECONE_API_KEY),
    });
    return pinecone;
  } catch (error) {
    console.error('Failed to initialize Pinecone Client:', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}

let pinecone: Pinecone | undefined;

(async () => {
  try {
    pinecone = await initPinecone();
  } catch (error) {
    console.error('Error initializing Pinecone:', error);
  }
})();

export { pinecone };
