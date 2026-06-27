import { StorageService } from './services/storage';
import { RAGService } from './services/rag';

async function runTests() {
  console.log('====================================');
  console.log('   StackOrbitAI CO-PILOT TEST SUITE  ');
  console.log('====================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  };

  // --- Test 1: Storage defaults ---
  try {
    const settings = StorageService.getSettings();
    assert(settings !== null, 'StorageService loads settings successfully');
    assert(settings.theme === 'dark', 'Default settings theme is dark');
    assert(settings.targetLanguage === 'hi', 'Default translation target is Hindi');
  } catch (err: any) {
    assert(false, `StorageService test threw error: ${err.message}`);
  }

  // --- Test 2: RAG Cosine Similarity ---
  try {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0]; // Exact match
    const vecC = [0, 1, 0]; // Orthogonal (perpendicular)
    const vecD = [-1, 0, 0]; // Opposite direction

    // Retrieve cosine similarity via private method accessing inside RAGService class
    // We can cast RAGService as any to call private methods
    const simAB = (RAGService as any).cosineSimilarity(vecA, vecB);
    const simAC = (RAGService as any).cosineSimilarity(vecA, vecC);
    const simAD = (RAGService as any).cosineSimilarity(vecA, vecD);

    assert(Math.abs(simAB - 1.0) < 0.0001, 'Cosine Similarity of identical vectors is 1.0');
    assert(Math.abs(simAC - 0.0) < 0.0001, 'Cosine Similarity of orthogonal vectors is 0.0');
    assert(Math.abs(simAD - (-1.0)) < 0.0001, 'Cosine Similarity of opposite vectors is -1.0');
  } catch (err: any) {
    assert(false, `Cosine Similarity test failed: ${err.message}`);
  }

  // --- Test 3: RAG Sliding Window Chunking ---
  try {
    const longText = Array(100).fill('word').join(' ');
    // Chunking text: 20 words chunk size, 5 words overlap
    const chunks = (RAGService as any).chunkText(longText, 20, 5);
    
    assert(chunks.length > 0, 'Text chunker produces partitioned outputs');
    assert(chunks[0].split(' ').length === 20, 'First chunk size matches chunk parameter (20 words)');
  } catch (err: any) {
    assert(false, `Text Chunking test failed: ${err.message}`);
  }

  console.log('\n====================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
