// test-sample.ts
import { createClient, Vector } from './src';

// Helper function to generate random vectors
function generateRandomVectorWithId(id: number | string, length: number): Vector {
  const values = Array.from({ length }, () => Math.random() * 2 - 1);
  return { id, values };
}

async function runTest() {
  try {
    // Initialize the client with default credentials
    const client = createClient({
      host: 'http://127.0.0.1:8443'
      // Default credentials will be used (admin/admin)
    });

    // Configuration
    const vectorDbName = 'testdb_sdk_ts';
    const dimension = 768;
    const description = 'Test Cosdata TypeScript SDK';

    console.log('Creating collection...');
    // Create collection and index
    const collection = await client.createCollection({
      name: vectorDbName,
      dimension,
      description
    });

    console.log('Creating index...');
    const index = await collection.createIndex({
      distanceMetric: 'cosine'
    });

    // Generate 1000 random vectors
    const batchVectors = Array.from({ length: 1000 }, (_, i) => 
      generateRandomVectorWithId(i + 1, dimension)
    );

    console.log(`Generated ${batchVectors.length} vectors`);

    // Upsert all vectors in a single transaction
    console.log('Upserting vectors...');
    await index.transaction(async (txn) => {
      await txn.upsert(batchVectors);
      console.log('Upserting complete - all vectors inserted in a single transaction');
    });

    // Select a random vector from the batch to query
    const queryVector = batchVectors[Math.floor(Math.random() * batchVectors.length)];
    console.log(`Querying with vector ID: ${queryVector.id}`);

    // Query the index
    const results = await index.query({
      vector: queryVector.values,
      nnCount: 5
    });
    console.log('Query results:', results);

    // Get collection info
    const collectionInfo = await collection.getInfo();
    console.log('Collection info:', collectionInfo);

    // List all collections
    console.log('All collections:');
    const collections = await client.collections();
    for (const coll of collections) {
      console.log(` - ${coll.name} (dimension: ${coll.dimension})`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
runTest(); 