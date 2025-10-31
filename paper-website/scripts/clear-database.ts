/**
 * Clear Database Script
 * 
 * This script clears all questions and metadata from the Convex database
 * Run with: npx ts-node scripts/clear-database.ts
 */

import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment variables from .env.local
config({ path: '.env.local' });

// Get Convex URL from environment
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable is not set');
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...\n');
  
  try {
    // Clear all questions
    console.log('🗑️  Clearing questions...');
    const questionResult = await convex.mutation(api.questions.clearAllQuestions);
    console.log(`  ✅ Deleted ${questionResult.deleted} questions\n`);
    
    // Clear all metadata
    console.log('🗑️  Clearing metadata (subjects, chapters, subtopics)...');
    const metadataResult = await convex.mutation(api.questions.clearAllMetadata);
    console.log(`  ✅ Deleted ${metadataResult.deleted.subjects} subjects`);
    console.log(`  ✅ Deleted ${metadataResult.deleted.chapters} chapters`);
    console.log(`  ✅ Deleted ${metadataResult.deleted.subtopics} subtopics\n`);
    
    console.log('✨ Database cleared successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run: npx convex dev (to push the new schema)');
    console.log('   2. Run: npx ts-node scripts/migrate-to-convex.ts (to import new data)');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearDatabase()
  .then(() => {
    console.log('\n✅ Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });

