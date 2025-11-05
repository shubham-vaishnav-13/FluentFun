import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'FFDB';

async function backupDatabase() {
  const client = new MongoClient(MONGODB_URI);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, `db-backup-${timestamp}`);

  try {
    // Create backup directory
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('🔄 Connecting to MongoDB...');
    await client.connect();

    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();

    console.log(`📦 Backing up database: ${DB_NAME}`);
    console.log(`📁 Backup location: ${backupDir}\n`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();

      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

      console.log(`✅ Backed up collection: ${collectionName} (${documents.length} documents)`);
    }

    console.log(`\n✨ Backup completed successfully!`);
    console.log(`📂 All data saved to: ${backupDir}`);

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

backupDatabase();
