import fs from 'fs';

function parseCSVRow(row) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parseCSV(content) {
  const records = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      // End of row
      if (current.trim() || records.length === 0) { // Skip empty lines except possibly the header
        records.push(current);
      }
      current = '';
    } else if (char === '\r' && !inQuotes) {
      // Skip carriage returns
      continue;
    } else {
      current += char;
    }
  }

  // Handle last row if not ended with newline
  if (current.trim()) {
    records.push(current);
  }

  return records;
}

// Test the fixed readCSV function
function readCSV(content) {
  // Parse CSV properly handling multiline quoted fields
  const records = parseCSV(content);

  if (records.length < 2) return [];

  const headers = parseCSVRow(records[0]).map(h => h.trim().replace(/\r$/, ''));
  const rows = records.slice(1).map(record => parseCSVRow(record));

  return rows.map(row => {
    // Handle malformed rows that have more than 18 fields
    // This happens when subtopic contains commas and isn't quoted
    let processedRow = row;
    if (row.length > 18) {
      // Merge extra fields into the subtopic (last field)
      const extraFields = row.slice(17); // Everything from subtopic onwards
      processedRow = row.slice(0, 17); // Everything up to subtopic
      processedRow.push(extraFields.join(', ')); // Join extra fields with comma
    } else if (row.length < 18) {
      // Pad with empty strings if too few fields
      while (processedRow.length < 18) {
        processedRow.push('');
      }
    }

    const obj = {};

    headers.forEach((header, index) => {
      let value = processedRow[index] || '';

      // Clean up the value - remove extra quotes and trim
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

const content = fs.readFileSync('public/csvs/GATE_CS_1996.csv', 'utf8');
const csvData = readCSV(content);

console.log('Total parsed rows:', csvData.length);
console.log('First row:', csvData[0]);
console.log('First row subtopic:', csvData[0].subtopic);
