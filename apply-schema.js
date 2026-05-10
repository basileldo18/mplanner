const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function applySchema() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/DATABASE_URL=(.*)/);
    if (!match) {
      console.error('DATABASE_URL not found in .env.local');
      return;
    }
    const databaseUrl = match[1].trim();
    const sql = neon(databaseUrl);
    const schema = fs.readFileSync('schema.sql', 'utf8');

    console.log('Applying schema...');
    // Split schema by semicolon and filter out empty strings
    const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      await sql.query(statement);
    }
    console.log('Schema applied successfully!');
  } catch (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  }
}

applySchema();
