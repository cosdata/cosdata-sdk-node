// test-sample.ts
import { createClient } from './src';
import { Vector } from './src/transaction';

function generateRandomVector(dimension: number): number[] {
  return Array.from({ length: dimension }, () => Math.random());
}

async function main() {
  // Initialize client
  const client = createClient({
    host: 'http://localhost:8443',
    username: 'admin',
    password: 'test_key'
  });

  // Create a dense collection
  const collectionName = 'test_collection';
  const collection = await client.createCollection({
    name: collectionName,
    dimension: 128,
    dense_vector: {
      enabled: true,
      dimension: 128,
      auto_create_index: false
    }
  });
  console.log('Created collection:', collectionName);

  // List all collections
  const collections = await client.listCollections();
  console.log('Collections:', collections);

  // Create a dense index
  const index = await collection.createIndex({
    name: `${collectionName}_dense_index`,
    distance_metric: 'cosine',
    quantization_type: 'auto',
    sample_threshold: 100,
    num_layers: 16,
    max_cache_size: 1024,
    ef_construction: 128,
    ef_search: 64,
    neighbors_count: 10,
    level_0_neighbors_count: 20
  });
  console.log('Created index');

  // Generate test dense vectors
  const numVectors = 100;
  const dimension = 128;
  const vectors: Vector[] = Array.from({ length: numVectors }, (_, i) => ({
    id: `vec_${i}`,
    dense_values: generateRandomVector(dimension),
    document_id: `doc_${i}`
  }));

  // Add dense vectors through a transaction
  console.log("Starting transaction...");
  const txn = collection.transaction();
  await txn.batch_upsert_vectors(vectors);
  await txn.commit();
  console.log("Added dense vectors through transaction");

  // Verify vector existence
  const testVectorId = vectors[0].id;
  const exists = await collection.getVectors().exists(testVectorId.toString());
  console.log(`\nVector ${testVectorId} exists: ${exists}`);

  console.log("\n=== Dense Search Operations ===");
  // Perform dense vector search
  const denseQueryVector = generateRandomVector(dimension);
  const denseResults = await collection.getSearch().dense({
    query_vector: denseQueryVector as number[],
    top_k: 5,
    return_raw_text: true
  });
  console.log(`Dense search results: ${JSON.stringify(denseResults)}`);

  // Get current version
  const versions = collection.getVersions();
  const currentVersion = await versions.getCurrent();
  console.log('Current version:', currentVersion);

  // Clean up
  await collection.delete();
  console.log('Deleted collection');
}

main().catch(console.error);