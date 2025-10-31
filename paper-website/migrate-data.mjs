import fs from 'fs';
import path from 'path';
import { ConvexHttpClient } from 'convex/browser';
import { api } from './convex/_generated/api.js';
import dotenv from 'dotenv';

// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config();

async function readCSV(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove BOM if present (UTF-8 BOM is 0xFEFF)
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  // Parse CSV properly handling multiline quoted fields
  const records = parseCSV(content);

  if (records.length < 2) return [];

  const headers = records[0].map(h => h.trim().replace(/\r$/, ''));
  const rows = records.slice(1);

  return rows.map(row => {
    const obj = {};

    headers.forEach((header, index) => {
      let value = row[index] || '';

      // Clean up the value - remove leading/trailing quotes and trim
      value = value.replace(/^"|"$/g, '').trim();

      // Convert empty strings to null for optional fields
      if (value === '') {
        obj[header] = null;
      } else {
        obj[header] = value;
      }
    });

    return obj;
  }).filter(row => {
    // Filter out completely empty rows or rows with missing required fields
    return row.Question_Number && row.Question_Text && row.Option_A && row.Option_B && row.Option_C && row.Option_D && row.Correct_Answer;
  });
}

// Parse CSV content properly handling multiline quoted fields
function parseCSV(content) {
  const records = [];
  let currentRecord = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        // Escaped quote - add one quote to the field and skip the next quote
        currentField += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRecord.push(currentField);
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of record (only if not in quotes)
      if (currentField || currentRecord.length > 0) {
        currentRecord.push(currentField);
        if (currentRecord.some(field => field.trim())) {
          // Only add non-empty records
          records.push(currentRecord);
        }
        currentRecord = [];
        currentField = '';
      }
      // Skip \r\n sequences
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
    } else {
      // Regular character
      currentField += char;
    }
  }

  // Handle last field and record
  if (currentField || currentRecord.length > 0) {
    currentRecord.push(currentField);
    if (currentRecord.some(field => field.trim())) {
      records.push(currentRecord);
    }
  }

  return records;
}

function mapCSVRowToQuestion(csvRow, year) {
  // Normalize correctAnswer to a single letter A/B/C/D
  const rawAnswer = (csvRow.Correct_Answer ?? '').toString().trim().toUpperCase();
  const letterMatch = rawAnswer.match(/[ABCD]/);
  const normalizedAnswer = letterMatch ? letterMatch[0] : 'A';

  const question = {
    year: parseInt(year),
    questionNumber: parseInt(csvRow.Question_Number) || 0,
    questionText: csvRow.Question_Text || '',
    optionA: csvRow.Option_A || '',
    optionB: csvRow.Option_B || '',
    optionC: csvRow.Option_C || '',
    optionD: csvRow.Option_D || '',
    correctAnswer: normalizedAnswer,
    questionType: csvRow.Question_Type || 'MCQ',
    explanation: csvRow.Explanation || '',
    subject: csvRow.subject || '',
    chapter: csvRow.chapter || '',
    subtopic: csvRow.subtopic || '',
  };

  // Only include optional image fields if they have a value (not null/empty)
  // Convex v.optional() means the field can be undefined, not null
  if (csvRow.Question_Images && typeof csvRow.Question_Images === 'string' && csvRow.Question_Images.trim() !== '') {
    question.questionImages = csvRow.Question_Images.trim();
  }
  if (csvRow.Option_A_Images && typeof csvRow.Option_A_Images === 'string' && csvRow.Option_A_Images.trim() !== '') {
    question.optionAImages = csvRow.Option_A_Images.trim();
  }
  if (csvRow.Option_B_Images && typeof csvRow.Option_B_Images === 'string' && csvRow.Option_B_Images.trim() !== '') {
    question.optionBImages = csvRow.Option_B_Images.trim();
  }
  if (csvRow.Option_C_Images && typeof csvRow.Option_C_Images === 'string' && csvRow.Option_C_Images.trim() !== '') {
    question.optionCImages = csvRow.Option_C_Images.trim();
  }
  if (csvRow.Option_D_Images && typeof csvRow.Option_D_Images === 'string' && csvRow.Option_D_Images.trim() !== '') {
    question.optionDImages = csvRow.Option_D_Images.trim();
  }
  if (csvRow.Explanation_Images && typeof csvRow.Explanation_Images === 'string' && csvRow.Explanation_Images.trim() !== '') {
    question.explanationImages = csvRow.Explanation_Images.trim();
  }

  return question;
}

async function migrateData() {
  // Try NEXT_PUBLIC_CONVEX_URL first (used elsewhere in the codebase), then CONVEX_URL
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!convexUrl) {
    console.error('Please set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable');
    console.error('You can set it in a .env.local file or export it in your shell');
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);

  // Optional: reset the database table before migrating to avoid duplicates
  const shouldReset = process.argv.includes('--reset');
  if (shouldReset) {
    console.log('Reset flag detected. Clearing existing questions...');
    try {
      await client.mutation(api.migration.clearAllQuestions, {});
      console.log('Cleared existing questions.');
    } catch (err) {
      console.error('Failed to clear existing questions:', err);
      process.exit(1);
    }
  }

  const csvDir = path.join(process.cwd(), 'public', 'csvs');
  const files = fs.readdirSync(csvDir).filter(file => file.endsWith('.csv'));

  console.log(`Found ${files.length} CSV files to migrate`);

  for (const file of files) {
    const year = file.match(/GATE_CS_(\d{4})\.csv/)?.[1];
    if (!year) {
      console.log(`Skipping ${file} - could not extract year`);
      continue;
    }

    console.log(`Processing ${file} (Year: ${year})`);

    const filePath = path.join(csvDir, file);
    const csvData = await readCSV(filePath);

    console.log(`Found ${csvData.length} questions in ${file}`);

    // Process in batches of 10 to avoid timeouts
    const batchSize = 10;
    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      const questions = batch.map(row => mapCSVRowToQuestion(row, year));

      try {
        await client.mutation(api.migration.insertGateQuestionsBulk, { questions });
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(csvData.length / batchSize)} for ${file}`);
      } catch (error) {
        console.error(`Error inserting batch for ${file}:`, error);
        // Continue with next batch
      }
    }

    console.log(`Completed processing ${file}`);
  }

  console.log('Migration completed!');
}

migrateData().catch(console.error);
