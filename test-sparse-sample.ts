// test-sparse-sample.ts
import { Client } from './src/client';
import { Collection } from './src/collection';
import { Vector } from './src/transaction';

/**
 * Generate a random sparse vector with specified dimension and sparsity
 */
function generateRandomSparseVector(dimension: number, sparsity: number = 0.1): { indices: number[], values: number[] } {
    const numNonZero = Math.floor(dimension * sparsity);
    const indices: number[] = [];
    const values: number[] = [];
    
    // Generate random indices
    const possibleIndices = new Set<number>();
    while (possibleIndices.size < numNonZero) {
        possibleIndices.add(Math.floor(Math.random() * dimension));
    }
    
    // Convert to sorted array and generate values
    indices.push(...Array.from(possibleIndices).sort((a, b) => a - b));
    for (let i = 0; i < indices.length; i++) {
        values.push(Math.random());
    }
    
    return { indices, values };
}

async function main() {
    // Initialize the client
    const client = new Client({
        host: "http://127.0.0.1:8443",
        username: "admin",
        password: "test_key"
    });

    // Configuration
    const collectionName = "test_sparse_collection";
    const dimension = 1000;
    const description = "Test collection for sparse vector operations";

    console.log("\n=== Sparse Collection Management ===");
    // Create a new collection with sparse vector support
    const collection = await client.createCollection({
        name: collectionName,
        dimension: dimension,
        description: description,
        dense_vector: {
            enabled: false,
            dimension: dimension
        },
        sparse_vector: {
            enabled: true
        }
    });
    console.log(`Created sparse collection: ${collection.getName()}`);

    // List all collections
    const collections = await client.collections();
    console.log("\nAll collections:");
    for (const coll of collections) {
        console.log(` - ${coll.getName()}`);
    }

    console.log("\n=== Sparse Index Management ===");
    // Create a sparse index
    const index = await collection.create_sparse_index(
        "sparse_index",
        64,  // quantization
        1000 // sample_threshold
    );
    console.log(`Created sparse index: sparse_index`);

    // Get index information
    const indexInfo = await collection.getIndex("sparse_index");
    console.log(`\nIndex information: ${JSON.stringify(indexInfo)}`);

    console.log("\n=== Sparse Vector Operations ===");
    // Generate test sparse vectors
    const numVectors = 1000;
    const sparseVectors: Vector[] = [];
    for (let i = 0; i < numVectors; i++) {
        const vectorId = `sparse_vec_${i + 1}`;
        const sparseData = generateRandomSparseVector(dimension);
        sparseVectors.push({
            id: vectorId,
            sparse_values: sparseData.values,
            sparse_indices: sparseData.indices,
            document_id: `doc_${Math.floor(i / 10)}` // Group vectors into documents
        });
    }
    console.log(`Generated ${sparseVectors.length} test sparse vectors`);

    // Add sparse vectors through a transaction
    console.log("Starting transaction...");
    const txn = collection.transaction();
    await txn.batch_upsert_vectors(sparseVectors);
    await txn.commit();
    console.log("Added sparse vectors through transaction");

    // Verify vector existence
    const testVectorId = sparseVectors[0].id;
    const exists = await collection.getVectors().exists(testVectorId.toString());
    console.log(`\nVector ${testVectorId} exists: ${exists}`);

    console.log("\n=== Sparse Search Operations ===");
    // Perform sparse vector search
    const sparseData = generateRandomSparseVector(dimension);
    const queryTerms: [number, number][] = sparseData.indices.map((idx, i) => [idx, sparseData.values[i]] as [number, number]);
    console.log(`Query vector: ${JSON.stringify(queryTerms.slice(0, 5))}...`); // Print first 5 terms for debugging
    
    const sparseResults = await collection.getSearch().sparse({
        query_terms: queryTerms,
        top_k: 5,
        early_terminate_threshold: 0.0,
        return_raw_text: true
    });
    console.log(`Sparse search results: ${JSON.stringify(sparseResults)}`);

    console.log("\n=== Version Management ===");
    // Get current version
    const currentVersion = await collection.getVersions().getCurrent();
    console.log(`Current version: ${JSON.stringify(currentVersion)}`);

    // Cleanup
    console.log("\n=== Cleanup ===");
    // Delete the index
    const url = `${client.getBaseUrl()}/collections/${collection.getName()}/indexes/sparse`;
    await client.getAxiosInstance().delete(url, {
        headers: client.getHeaders(),
        httpsAgent: client.getVerifySSL() ? undefined : { rejectUnauthorized: false }
    });
    console.log("Deleted sparse index");

    // Delete the collection
    await collection.delete();
    console.log("Deleted collection");
}

main().catch(error => {
    console.error("Error:", error);
    process.exit(1);
}); 