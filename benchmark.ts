const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const MOCK_LATENCY = 50; // 50ms per network roundtrip

async function simulateNPlusOne(docIds: string[]) {
  const start = performance.now();
  for (const id of docIds) {
    // Simulate `supabase.from("document_ocr_cache").select(...).eq("document_id", id)`
    await delay(MOCK_LATENCY);
  }
  const end = performance.now();
  return end - start;
}

async function simulateBatch(docIds: string[]) {
  const start = performance.now();
  if (docIds.length > 0) {
    // Simulate `supabase.from("document_ocr_cache").select(...).in("document_id", docIds)`
    await delay(MOCK_LATENCY);
  }
  const end = performance.now();
  return end - start;
}

async function runBenchmark() {
  const docs = Array.from({ length: 10 }, (_, i) => `doc-${i}`);

  console.log("Running N+1 Simulation...");
  const nPlusOneTime = await simulateNPlusOne(docs);
  console.log(`N+1 Time (10 docs): ${nPlusOneTime.toFixed(2)}ms`);

  console.log("Running Batch Simulation...");
  const batchTime = await simulateBatch(docs);
  console.log(`Batch Time (10 docs): ${batchTime.toFixed(2)}ms`);

  console.log(`Improvement: ${(nPlusOneTime / batchTime).toFixed(2)}x faster`);
}

runBenchmark();
