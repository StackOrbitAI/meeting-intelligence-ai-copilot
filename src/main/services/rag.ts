import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { AIService } from './ai';
import { StorageService } from './storage';

export interface FileChunk {
  id: string;
  filePath: string;
  fileName: string;
  content: string;
  embedding: number[];
}

export class RAGService {
  private static getUserDataPath(): string {
    try {
      return app.getPath('userData');
    } catch {
      return path.resolve(__dirname, '../../../');
    }
  }

  private static getVectorFilePath(brainId: string): string {
    return path.join(this.getUserDataPath(), `vectors_${brainId}.json`);
  }

  /**
   * Load chunks for a specific client brain
   */
  private static loadBrainChunks(brainId: string): FileChunk[] {
    const filePath = this.getVectorFilePath(brainId);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as FileChunk[];
    } catch {
      return [];
    }
  }

  /**
   * Save chunks for a specific client brain
   */
  private static saveBrainChunks(brainId: string, chunks: FileChunk[]) {
    const filePath = this.getVectorFilePath(brainId);
    fs.writeFileSync(filePath, JSON.stringify(chunks, null, 2));
  }

  /**
   * Helper to strip HTML tags
   */
  private static cleanHtml(html: string): string {
    return html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Helper to chunk text using sliding window
   */
  private static chunkText(text: string, chunkSize: number = 800, chunkOverlap: number = 150): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let i = 0;

    while (i < words.length) {
      const chunkWords = words.slice(i, i + chunkSize);
      if (chunkWords.length > 0) {
        chunks.push(chunkWords.join(' '));
      }
      i += (chunkSize - chunkOverlap);
      if (i >= words.length - chunkOverlap) {
        break; // Avoid small trailing chunks
      }
    }
    return chunks;
  }

  /**
   * Extract text from various document formats
   */
  private static async extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    switch (ext) {
      case '.txt':
      case '.md':
      case '.markdown':
        return fs.readFileSync(filePath, 'utf-8');

      case '.html':
      case '.htm': {
        const rawHtml = fs.readFileSync(filePath, 'utf-8');
        return this.cleanHtml(rawHtml);
      }

      case '.csv': {
        const csvContent = fs.readFileSync(filePath, 'utf-8');
        return csvContent;
      }

      case '.pdf': {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
      }

      case '.docx': {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      }

      case '.xlsx':
      case '.xls': {
        const workbook = xlsx.readFile(filePath);
        let fullText = '';
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csv = xlsx.utils.sheet_to_csv(sheet);
          fullText += `Sheet: ${sheetName}\n${csv}\n\n`;
        }
        return fullText;
      }

      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  /**
   * Index file into selected Client Brain vector store
   */
  static async indexFile(brainId: string, filePath: string, fileName: string): Promise<number> {
    console.log(`[RAG] Indexing file: ${fileName} for brain: ${brainId}`);
    
    // 1. Extract raw text
    const text = await this.extractText(filePath);
    if (!text || text.trim() === '') {
      throw new Error('No text content could be extracted from the file.');
    }

    // 2. Split text into chunks
    const textChunks = this.chunkText(text);
    console.log(`[RAG] Split file into ${textChunks.length} chunks.`);

    // 3. Compute embeddings and map to Chunk list
    const fileChunks: FileChunk[] = [];
    for (let i = 0; i < textChunks.length; i++) {
      const content = textChunks[i];
      try {
        const embedding = await AIService.getEmbedding(content);
        fileChunks.push({
          id: `chunk_${brainId}_${Date.now()}_${i}`,
          filePath,
          fileName,
          content,
          embedding
        });
      } catch (err: any) {
        console.error(`[RAG] Failed to compute embedding for chunk ${i}:`, err.message || err);
        // Continue indexing other chunks if one fails, or halt if needed
        throw new Error(`Embedding generation failed: ${err.message || err}`);
      }
    }

    // 4. Append to existing brain chunks database
    const existingChunks = this.loadBrainChunks(brainId);
    
    // Remove any previous versions of this file if already indexed
    const updatedChunks = existingChunks.filter(c => c.fileName !== fileName);
    updatedChunks.push(...fileChunks);
    
    this.saveBrainChunks(brainId, updatedChunks);

    // 5. Update Brain Metadata in brains.json
    const brains = StorageService.getBrains();
    const idx = brains.findIndex(b => b.id === brainId);
    if (idx !== -1) {
      const brain = brains[idx];
      // Remove document entry if already exists
      brain.documents = brain.documents.filter(d => d.fileName !== fileName);
      
      brain.documents.push({
        id: `doc_${Date.now()}`,
        filePath,
        fileName,
        fileType: path.extname(filePath).slice(1).toUpperCase(),
        uploadedAt: new Date().toISOString(),
        chunkCount: fileChunks.length
      });
      StorageService.saveBrains(brains);
    }

    return fileChunks.length;
  }

  /**
   * Index raw text directly (e.g. pasted chat analysis summary) under a source name.
   */
  static async indexRawText(brainId: string, text: string, sourceName: string): Promise<number> {
    console.log(`[RAG] Indexing raw text for brain: ${brainId}, source: ${sourceName}`);
    if (!text || text.trim() === '') {
      throw new Error('No raw text content provided.');
    }

    const textChunks = this.chunkText(text, 500, 100);
    console.log(`[RAG] Split raw text into ${textChunks.length} chunks.`);

    const fileChunks: FileChunk[] = [];
    for (let i = 0; i < textChunks.length; i++) {
      const content = textChunks[i];
      try {
        const embedding = await AIService.getEmbedding(content);
        fileChunks.push({
          id: `chunk_${brainId}_raw_${Date.now()}_${i}`,
          filePath: `raw_text://${sourceName}`,
          fileName: sourceName,
          content,
          embedding
        });
      } catch (err: any) {
        console.error(`[RAG] Failed to compute embedding for raw chunk ${i}:`, err.message || err);
        throw new Error(`Embedding generation failed: ${err.message || err}`);
      }
    }

    const existingChunks = this.loadBrainChunks(brainId);
    const updatedChunks = existingChunks.filter(c => c.fileName !== sourceName);
    updatedChunks.push(...fileChunks);
    this.saveBrainChunks(brainId, updatedChunks);

    const brains = StorageService.getBrains();
    const idx = brains.findIndex(b => b.id === brainId);
    if (idx !== -1) {
      const brain = brains[idx];
      brain.documents = brain.documents.filter(d => d.fileName !== sourceName);
      brain.documents.push({
        id: `doc_raw_${Date.now()}`,
        filePath: `raw_text://${sourceName}`,
        fileName: sourceName,
        fileType: 'TXT',
        uploadedAt: new Date().toISOString(),
        chunkCount: fileChunks.length
      });
      StorageService.saveBrains(brains);
    }

    return fileChunks.length;
  }

  /**
   * Delete document and its chunks from Client Brain vector store
   */
  static deleteFile(brainId: string, fileName: string): number {
    console.log(`[RAG] Deleting file ${fileName} from brain: ${brainId}`);
    
    // 1. Remove chunks
    const chunks = this.loadBrainChunks(brainId);
    const filteredChunks = chunks.filter(c => c.fileName !== fileName);
    this.saveBrainChunks(brainId, filteredChunks);

    // 2. Remove document from brains.json metadata
    const brains = StorageService.getBrains();
    const idx = brains.findIndex(b => b.id === brainId);
    if (idx !== -1) {
      brains[idx].documents = brains[idx].documents.filter(d => d.fileName !== fileName);
      StorageService.saveBrains(brains);
    }

    return chunks.length - filteredChunks.length;
  }

  /**
   * Cosine Similarity calculator helper
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    // Vector dimensions must match
    const limit = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < limit; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Queries vector space to find top-k relevant chunks
   */
  static async searchBrain(brainId: string, query: string, topK: number = 3): Promise<string> {
    console.log(`[RAG] Searching brain: ${brainId} for query: "${query}"`);
    
    const chunks = this.loadBrainChunks(brainId);
    if (chunks.length === 0) {
      return '';
    }

    try {
      // 1. Get query embedding
      const queryEmbedding = await AIService.getEmbedding(query);

      // 2. Compute similarity for each chunk
      const scoredChunks = chunks.map(chunk => {
        const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
        return { chunk, score };
      });

      // 3. Sort by similarity score descending and pick topK
      scoredChunks.sort((a, b) => b.score - a.score);
      const topChunks = scoredChunks.slice(0, topK);

      console.log(`[RAG] Found matches. Top score: ${topChunks[0]?.score || 0}`);

      // 4. Concatenate contexts
      return topChunks
        .map(tc => `[Source file: ${tc.chunk.fileName}] ${tc.chunk.content}`)
        .join('\n\n');
    } catch (err) {
      console.error('[RAG] Error searching brain vector index:', err);
      return '';
    }
  }
}
