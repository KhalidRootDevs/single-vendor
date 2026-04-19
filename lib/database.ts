import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

const CONNECTION_OPTIONS: mongoose.ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function attachConnectionListeners() {
  const db = mongoose.connection;

  db.on('connected', () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MongoDB] Connected');
    }
  });

  db.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected');
    cached.conn = null;
    cached.promise = null;
  });

  db.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
    cached.conn = null;
    cached.promise = null;
  });
}

let listenersAttached = false;

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!listenersAttached) {
    attachConnectionListeners();
    listenersAttached = true;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          return await mongoose.connect(MONGODB_URI, CONNECTION_OPTIONS);
        } catch (err) {
          const isLast = attempt === MAX_RETRIES;
          if (isLast) throw err;
          console.warn(
            `[MongoDB] Connection attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms…`
          );
          await sleep(RETRY_DELAY_MS);
        }
      }
      throw new Error('[MongoDB] All connection attempts failed');
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;
