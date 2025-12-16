/**
 * Database Connection
 * Uses postgres.js with Supabase Pooler for serverless compatibility
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// Serverless-optimized: prepare=false required for Supabase transaction pooler
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client);