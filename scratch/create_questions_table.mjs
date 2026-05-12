import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_fjLuA43JrWxd@ep-round-sunset-amh1k0go-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function fix() {
  const sql = neon(DATABASE_URL);
  console.log("Creating important_questions table...");
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS important_questions (
        id TEXT PRIMARY KEY,
        topic_name TEXT NOT NULL,
        title TEXT NOT NULL,
        image_data TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("Table creation successful!");
  } catch (err) {
    console.error("Table creation failed:", err);
  }
}

fix();
