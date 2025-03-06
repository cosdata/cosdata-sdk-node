# COSDATA Vector Store (Node.js SDK)

A TypeScript/JavaScript SDK for interacting with the COSDATA Vector Database API.

## Installation

```bash
npm install cosdata-sdk
```

## Usage

### Basic Usage

```typescript
import { createClient } from 'cosdata-sdk';

// Initialize the client
const client = createClient({
  host: 'http://127.0.0.1:8443',
  username: 'admin',
  password: 'admin'
});

// Create a collection
const collection = await client.createCollection({
  name: 'my_vectors',
  dimension: 768,
  description: 'My vector collection'
});

// Create an index
const index = await collection.createIndex({
  distanceMetric: 'cosine'
});

// Insert vectors
const vectors = [
  { id: 1, values: [0.1, 0.2, 0.3, /* ... */] },
  { id: 2, values: [0.2, 0.3, 0.4, /* ... */] },
  // ...
];

// Using a transaction
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

The SDK provides transaction management for batch operations:

```typescript
// Manual transaction management
const txn = index.createTransaction();
try {
  await txn.upsert(vectors);
  await txn.commit();
} catch (error) {
  await txn.abort();
  throw error;
}

// Automatic transaction management (recommended)
await index.transaction(async (txn) => {
  await txn.upsert(vectors);
  // Transaction is automatically committed on success
  // or aborted on error
});
```

## API Reference

### Client

- `createClient(options)`: Create a new client instance
- `client.createCollection(options)`: Create a new collection
- `client.getCollection(name)`: Get an existing collection
- `client.collection(name)`: Alias for getCollection
- `client.listCollections()`: List all collections
- `client.collections()`: Get all collections as Collection objects

### Collection

- `collection.createIndex(options)`: Create a new index
- `collection.index(distanceMetric)`: Get or create an index
- `collection.getInfo()`: Get collection information

### Index

- `index.createTransaction()`: Create a new transaction
- `index.transaction(callback)`: Execute operations in a transaction
- `index.query(options)`: Search for similar vectors
- `index.fetchVector(id)`: Fetch a specific vector by ID

### Transaction

- `transaction.upsert(vectors)`: Insert or update vectors
- `transaction.commit()`: Commit the transaction
- `transaction.abort()`: Abort the transaction

## License

MIT