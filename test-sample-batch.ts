import { Client } from './src/client';
import { Collection } from './src/collection';
import { Index } from './src/index';
import { Transaction, Vector } from './src/transaction';

// Configure logging
const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error ? error : '')
};

/**
 * Generate a random vector of the specified dimension.
 */
function generateRandomVector(dimension: number): number[] {
  const vector: number[] = [];
  for (let i = 0; i < dimension; i++) {
    vector.push(Math.random() * 2 - 1); // Random value between -1 and 1
  }
  return vector;
}

/**
 * Create a test collection with the specified parameters.
 */
async function createTestCollection(client: Client, name: string, dimension: number): Promise<Collection> {
  logger.info(`Creating collection: ${name}`);
  return client.createCollection({
    name,
    dimension,
    description: "Test collection for batch operations"
  });
}

/**
 * Create a test index for the collection.
 */
async function createTestIndex(collection: Collection, name: string): Promise<Index> {
  logger.info(`Creating index: ${name}`);
  return collection.createIndex({
    name,
    distance_metric: "cosine",
    num_layers: 7,
    max_cache_size: 1000,
    ef_construction: 512,
    ef_search: 256,
    neighbors_count: 32,
    level_0_neighbors_count: 64
  });
}

/**
 * Generate test vectors.
 */
function generateTestVectors(numVectors: number, dimension: number): Vector[] {
  logger.info(`Generating ${numVectors} test vectors`);
  const vectors: Vector[] = [];
  for (let i = 0; i < numVectors; i++) {
    const vectorId = `vec_${i + 1}`;
    const denseValues = generateRandomVector(dimension);
    vectors.push({
      id: vectorId,
      dense_values: denseValues,
      document_id: `doc_${Math.floor(i / 10)}` // Group vectors into documents
    });
  }
  return vectors;
}

/**
 * Perform test queries.
 */
async function performTestQueries(collection: Collection, numQueries: number, dimension: number): Promise<any[]> {
  logger.info(`Performing ${numQueries} test queries`);
  const results: any[] = [];
  for (let i = 0; i < numQueries; i++) {
    const queryVector = generateRandomVector(dimension);
    const result = await collection.getSearch().dense({
      query_vector: queryVector,
      top_k: 5,
      return_raw_text: true
    });
    results.push(result);
  }
  return results;
}

/**
 * Main test function.
 */
async function main() {
  logger.info("Starting test_sample_batch.ts...");
  
  try {
    // Initialize the client
    logger.info("Initializing client...");
    const client = new Client({
      host: "http://127.0.0.1:8443",
      username: "admin",
      password: "test_key"
    });
    logger.info("Client initialized successfully");

    // Configuration
    const collectionName = "test_batch_collection";
    const dimension = 768;
    const numVectors = 10000;
    const numQueries = 3;

    // Create collection and index
    const collection = await createTestCollection(client, collectionName, dimension);
    const index = await createTestIndex(collection, "dense_index");

    // Generate random vectors
    const vectors: Vector[] = Array.from({ length: numVectors }, (_, i) => ({
        id: `vec_${i}`,
        dense_values: Array.from({ length: dimension }, () => Math.random() * 2 - 1),
        document_id: `doc_${Math.floor(i/10)}`  // Group vectors into documents
    }));

    // Test single vector upsert
    logger.info("Testing single vector upsert...");
    const txn1 = collection.transaction();
    logger.info("Upserting single vector...");
    await txn1.upsert_vector(vectors[0]);
    await txn1.commit();
    logger.info("Successfully upserted single vector");

    // Test batch vector upsert
    logger.info("Testing batch vector upsert...");
    const txn2 = collection.transaction();
    logger.info("Upserting remaining vectors...");
    const startTime = Date.now();
    await txn2.batch_upsert_vectors(vectors.slice(1));
    const endTime = Date.now();
    const elapsed = (endTime - startTime) / 1000;
    logger.info(`batch_upsert_vectors took ${elapsed.toFixed(2)} seconds.`);
    await txn2.commit();
    logger.info("Successfully upserted remaining vectors");

    // Perform test queries
    const results = await performTestQueries(collection, numQueries, dimension);
    for (let i = 0; i < results.length; i++) {
      logger.info(`Query ${i + 1} results: ${JSON.stringify(results[i])}`);
    }

    // Cleanup
    logger.info("Cleaning up...");
    const denseIndex = await collection.getIndex("dense_index");
    await denseIndex.delete();
    await collection.delete();
    logger.info("Cleanup completed successfully");

  } catch (error) {
    logger.error("An error occurred:", error);
    throw error;
  }
}

// Run the main function
main().catch(error => {
  logger.error("Fatal error:", error);
  process.exit(1);
}); 