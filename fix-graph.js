import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the file
const filePath = path.join(__dirname, 'src', 'server', 'lib', 'graph.ts');

// Async function to process the file
async function processFile() {
  try {
    // Read the file
    console.log(`Reading file: ${filePath}`);
    const data = await fs.promises.readFile(filePath, 'utf8');
    
    // Remove line numbers at the beginning of lines (e.g., "470|")
    const cleanedContent = data.replace(/^\d+\|/gm, '');
    
    // Write the cleaned content back to the file
    await fs.promises.writeFile(filePath, cleanedContent, 'utf8');
    console.log('File has been successfully cleaned and saved.');
  } catch (err) {
    console.error(`Error processing file: ${err}`);
  }
}

// Execute the async function
processFile();

