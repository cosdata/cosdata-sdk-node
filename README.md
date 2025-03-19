# COSDATA Vector Store (Node.js SDK)

A TypeScript/JavaScript SDK for interacting with the COSDATA Vector Database API.

## Installation

```bash
npm install cosdata-sdk
```

## Usage

### Basic Usage

```typescript
import { Client } from 'cosdata-sdk';

// Initialize the client
const client = new Client({
  host: 'http://127.0.0.1:8443',
  username: 'admin',
  password: 'admin',
  verifySSL: false
});

// Create a collection
const collection = await client.createCollection({
  name: 'my_vectors',
  dimension: 768,
  description: 'My vector collection'
});

// Create an index with custom parameters
const index = await collection.createIndex({
  distanceMetric: 'cosine',
  numLayers: 7,
  maxCacheSize: 1000,
  efConstruction: 512,
  efSearch: 256,
  neighborsCount: 32,
  level0NeighborsCount: 64
});

// Insert vectors
const vectors = [
  { 
    id: 1, 
    values: [0.1, 0.2, 0.3, /* ... */],
    title: 'Sample Document',
    category: 'documentation'
  },
  { 
    id: 2, 
    values: [0.2, 0.3, 0.4, /* ... */],
    title: 'Another Document'
  }
];

// Using automatic transaction management (recommended)
await index.transaction(async (txn) => {
  await txn.upsert(vectors);
});

// Query vectors
const results = await index.query({
  vector: [0.1, 0.2, 0.3, /* ... */],
  nnCount: 5
});

// Fetch a specific vector
const vector = await index.fetchVector(1);

// Get collection info
const info = await collection.getInfo();

// List all collections
const collections = await client.collections();
```

### Transaction Management

The SDK provides two ways to manage transactions:

```typescript
// Automatic transaction management (recommended)
await index.transaction(async (txn) => {
  await txn.upsert(vectors);
  // Transaction is automatically committed on success
  // or aborted on error
});

// Manual transaction management
const txn = index.createTransaction();
try {
  await txn.upsert(vectors);
  await txn.commit();
} catch (error) {
  await txn.abort();
  throw error;
}
```

## API Reference

### Client

- `new Client(options)`: Create a new client instance
  - `options.host`: Server host URL (default: 'http://127.0.0.1:8443')
  - `options.username`: Username for authentication (default: 'admin')
  - `options.password`: Password for authentication (default: 'admin')
  - `options.verifySSL`: Whether to verify SSL certificates (default: false)
- `client.createCollection(options)`: Create a new collection
  - `options.name`: Name of the collection
  - `options.dimension`: Vector dimension (default: 1024)
  - `options.description`: Optional collection description
- `client.getCollection(name)`: Get an existing collection
- `client.collection(name)`: Alias for getCollection
- `client.listCollections()`: List all collections
- `client.collections()`: Get all collections as Collection objects

### Collection

- `collection.createIndex(options)`: Create a new index
  - `options.distanceMetric`: Type of distance metric (default: 'cosine')
  - `options.numLayers`: Number of layers in HNSW graph (default: 7)
  - `options.maxCacheSize`: Maximum cache size (default: 1000)
  - `options.efConstruction`: ef parameter for construction (default: 512)
  - `options.efSearch`: ef parameter for search (default: 256)
  - `options.neighborsCount`: Number of neighbors (default: 32)
  - `options.level0NeighborsCount`: Level 0 neighbors count (default: 64)
- `collection.index(distanceMetric)`: Get or create an index
- `collection.getInfo()`: Get collection information

### Index

- `index.createTransaction()`: Create a new transaction
- `index.transaction(callback)`: Execute operations in a transaction
- `index.query(options)`: Search for similar vectors
  - `options.vector`: Query vector
  - `options.nnCount`: Number of nearest neighbors (default: 5)
- `index.fetchVector(id)`: Fetch a specific vector by ID

### Transaction

- `transaction.upsert(vectors)`: Insert or update vectors
- `transaction.commit()`: Commit the transaction
- `transaction.abort()`: Abort the transaction

## License

MIT