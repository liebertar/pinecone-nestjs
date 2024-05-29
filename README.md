# Application structure
nestjs-pinecone
│
├── src
│   ├── app.module.ts
│   ├── main.ts
│   ├── config
│   │   ├── pinecone.config.ts
│   ├── constants
│   │   └── api-urls.ts
│   ├── ingestion
│   │   ├── ingestion.controller.ts
│   │   ├── ingestion.module.ts
│   │   ├── ingestion.service.ts
│   ├── utils
│   │   ├── pinecone-client.ts
│   │   └── file-utils.ts
│   └── uploads
├── .env
├── globals.d.ts
├── package.json
└── tsconfig.json

# Test process 
PDF Embedding -> 512 dimension (tensor) -> pinecone Database

# Set Up Postman:
Ingest All PDFs:
URL: http://localhost:3000/ingestion/ingest-all
Method: POST
Ingest a Specific PDF:
URL: http://localhost:3000/ingestion/ingest/example.pdf
Method: POST
Upload PDF and Set Metadata:
URL: http://localhost:3000/ingestion/set-metadata
Method: POST
Headers: Content-Type: multipart/form-data