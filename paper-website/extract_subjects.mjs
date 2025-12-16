import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSONS_DIR = path.join(__dirname, 'public', 'jsons raw_cleaned');
const subjects = new Set();

try {
  const files = fs.readdirSync(JSONS_DIR);
  
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(JSONS_DIR, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        if (data.results && Array.isArray(data.results)) {
          data.results.forEach(q => {
            if (q.subject) {
              subjects.add(q.subject.trim());
            }
          });
        }
      } catch (err) {
        console.error(`Error reading ${file}: ${err.message}`);
      }
    }
  });

  console.log("All Subjects:");
  const sortedSubjects = Array.from(subjects).sort();
  sortedSubjects.forEach(s => console.log(`- ${s}`));
  console.log(`\nTotal: ${sortedSubjects.length} subjects`);

} catch (err) {
  console.error("Error:", err);
}
