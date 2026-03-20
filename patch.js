const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getRelativePrefix(filePath) {
  const dir = path.dirname(filePath);
  const relativeFromSrc = path.relative(srcDir, dir);
  if (!relativeFromSrc) return './';
  
  const depth = relativeFromSrc.split(path.sep).length;
  return '../'.repeat(depth);
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  // Replace imports like: import { ... } from "@/components/..."
  // Also string imports: import "@/styles/..."
  // And dynamic imports: import("@/...")
  const prefix = getRelativePrefix(filePath);
  
  // Regex to match from "@/(xyz)" or import "@/(xyz)"
  // Lookahead/behind or just capturing groups
  const regex = /from\s+['"]@\/(.*?)['"]/g;
  newContent = newContent.replace(regex, (match, p1) => {
    return `from "${prefix}${p1}"`;
  });

  const regexImportOnly = /import\s+['"]@\/(.*?)['"]/g;
  newContent = newContent.replace(regexImportOnly, (match, p1) => {
    return `import "${prefix}${p1}"`;
  });

  const regexDynamic = /import\(['"]@\/(.*?)['"]\)/g;
  newContent = newContent.replace(regexDynamic, (match, p1) => {
    return `import("${prefix}${p1}")`;
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${path.relative(__dirname, filePath)}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      processFile(fullPath);
    }
  }
}

console.log('Starting alias replacement script...');
walk(srcDir);
console.log('Alias replacement complete.');
