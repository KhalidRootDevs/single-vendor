import { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  // eslint-disable-next-line no-var
  var __MONGOD__: MongoMemoryServer;
}

// globalSetup: runs once before all test suites (no jest globals available here)
export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-jwt-secret-for-tests-only';
  // Make URI available across worker processes
  (process.env as Record<string, string>).MONGO_URI_FOR_TESTS = mongod.getUri();
}
