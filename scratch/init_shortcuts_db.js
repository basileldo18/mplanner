
const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_fjLuA43JrWxd@ep-round-sunset-amh1k0go-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function init() {
  try {
    console.log("Creating topic_shortcuts table...");
    await sql`
      CREATE TABLE IF NOT EXISTS topic_shortcuts (
        id UUID PRIMARY KEY,
        topic_name TEXT NOT NULL,
        image_data TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Table created successfully!");
  } catch (err) {
    console.error("Error creating table:", err);
  }
}

init();
