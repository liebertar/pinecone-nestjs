import { Controller, Post, Param, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type { Express } from 'express';
import { IngestionService } from './ingestion.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('ingest/:file')
  async ingestPdf(@Param('file') file: string) {
    const filePath = path.join(__dirname, '..', '..', 'src', 'docs', file); 
    return this.ingestionService.processPdf(filePath);
  }

  @Post('set-metadata')
  @UseInterceptors(FileInterceptor('pdf'))
  async setMetadata(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: { source: string }
  ) {
    const filePath = path.join(__dirname, '..', '..', 'src', 'uploads', file.originalname);
    await fs.promises.writeFile(filePath, file.buffer);

    const result = await this.ingestionService.processPdf(filePath);

    await fs.promises.unlink(filePath);

    return result;
  }

  @Post('ingest-all')
  async ingestAllPdfs() {
    const directoryPath = path.join(__dirname, '..', '..', 'src', 'docs');
    return this.ingestionService.processAllPdfsInDirectory(directoryPath);
  }
}