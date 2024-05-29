export const API_BASE_URL = process.env.BASE_URL || 'http://localhost:4044';

export const PINECONE_API = {
  INDEX_NAME: process.env.PINECONE_INDEX_NAME,
  NAMESPACE: process.env.PINECONE_NAME_SPACE || 'default-namespace',
};

export const FILE_UPLOAD_PATHS = {
  PDF_UPLOADS: 'uploads/pdfs',
};

const UPLOAD_BASE_API = `${API_BASE_URL}/ingestion`;

export const UPLOAD_API = {
  PDF_UPLOAD: `${UPLOAD_BASE_API}/upload`,
};
