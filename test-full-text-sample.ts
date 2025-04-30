// test-full-text-sample.ts
import { Client } from './src/client';
import { Collection } from './src/collection';
import { Vector } from './src/transaction';

/**
 * Generate random text with the specified number of words
 */
function generateRandomText(numWords: number = 50): string {
    // Sample words for text generation
    const words = [
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
        "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
        "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
        "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
        "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
        "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
        "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
        "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
        "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
        "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
    ];
    
    const result: string[] = [];
    for (let i = 0; i < numWords; i++) {
        result.push(words[Math.floor(Math.random() * words.length)]);
    }
    return result.join(" ");
}

async function main() {
    // Initialize the client
    const client = new Client({
        host: "http://127.0.0.1:8443",
        username: "admin",
        password: "test_key"
    });

    // Configuration
    const collectionName = "test_text_collection";
    const dimension = 768;
    const description = "Test collection for full-text search operations";

    console.log("\n=== Text Collection Management ===");
    // Create a new text collection
    const collection = await client.createCollection({
        name: collectionName,
        dimension: dimension,
        description: description,
        dense_vector: {
            enabled: false,
            dimension: dimension
        },
        sparse_vector: {
            enabled: false
        },
        tf_idf_options: {
            enabled: true
        }
    });
    console.log(`Created text collection: ${collection.getName()}`);

    // List all collections
    const collections = await client.collections();
    console.log("\nAll collections:");
    for (const coll of collections) {
        console.log(` - ${coll.getName()}`);
    }

    console.log("\n=== TF-IDF Index Management ===");
    // Create a TF-IDF index with BM25 parameters
    const index = await collection.create_tf_idf_index(
        "tf_idf_index",
        1000,  // sample_threshold
        1.5,   // k1 parameter
        0.75   // b parameter
    );
    console.log(`Created TF-IDF index: ${index.name}`);

    // Get index information
    const indexInfo = await collection.getIndex(index.name);
    console.log(`\nIndex information: ${JSON.stringify(indexInfo)}`);

    console.log("\n=== Text Vector Operations ===");
    // Generate some test text documents
    const numDocuments = 1000;
    const textDocuments: Vector[] = [];
    for (let i = 0; i < numDocuments; i++) {
        const vectorId = `doc_${i + 1}`;
        // Generate text with varying lengths
        const text = generateRandomText(Math.floor(Math.random() * 80) + 20);
        textDocuments.push({
            id: vectorId,
            text: text,
            document_id: `doc_${Math.floor(i / 10)}` // Group documents
        });
    }
    console.log(`Generated ${textDocuments.length} test documents`);

    // Add text documents through a transaction
    console.log("Starting transaction...");
    const txn = collection.transaction();
    await txn.batch_upsert_vectors(textDocuments);
    await txn.commit();
    console.log("Added text documents through transaction");

    // Verify document existence
    const testDocId = textDocuments[0].id;
    const exists = await collection.getVectors().exists(testDocId.toString());
    console.log(`\nDocument ${testDocId} exists: ${exists}`);

    console.log("\n=== Text Search Operations ===");
    // Perform text search with different queries
    const testQueries = [
        "the quick brown fox jumps over the lazy dog",
        "people into year your good some could",
        "back after use two how our work first",
        "even new want because any these give",
        "day most us the be to of and"
    ];
    
    for (const query of testQueries) {
        console.log(`\nSearch query: ${query}`);
        const textResults = await collection.getSearch().text({
            query_text: query,
            top_k: 5,
            return_raw_text: true
        });
        console.log(`Text search results: ${JSON.stringify(textResults)}`);
    }

    console.log("\n=== Version Management ===");
    // Get current version
    const currentVersion = await collection.getVersions().getCurrent();
    console.log(`Current version: ${JSON.stringify(currentVersion)}`);

    // Cleanup
    console.log("\n=== Cleanup ===");
    // Delete the index
    await index.delete();
    console.log("Deleted TF-IDF index");

    // Delete the collection
    await collection.delete();
    console.log("Deleted collection");
}

main().catch(error => {
    console.error("Error:", error);
    process.exit(1);
}); 