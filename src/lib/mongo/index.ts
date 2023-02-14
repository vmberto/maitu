import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

let client = new MongoClient(process.env.MONGODB_URI, {});
let clientPromise: Promise<MongoClient>;

// if (process.env.NODE_ENV === 'production') {
//   if (!(global as any)._mongoClientPromise) {
//     (global as any)._mongoClientPromise = client.connect();
//   }
//   clientPromise = (global as any)._mongoClientPromise;
// } else {
clientPromise = client.connect();
// }

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
