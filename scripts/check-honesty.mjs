import fs from 'fs';
import path from 'path';

let failed = false;

function scanDir(dir, filterFn, checkFn) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        scanDir(fullPath, filterFn, checkFn);
      }
    } else if (filterFn(fullPath)) {
      checkFn(fullPath);
    }
  }
}

console.log("=== Checking Honesty & RTL Discipline ===\n");

// 1. Ban Math.random in src/engine
scanDir(
  'src/engine',
  file => file.endsWith('.ts') || file.endsWith('.js'),
  file => {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('Math.random')) {
      console.error(`❌ BANNED: Math.random found in measurement engine: ${file}`);
      failed = true;
    }
  }
);

// 2. Ban physical left/right CSS utilities in UI components
const physicalPatterns = [
  /\b(ml|mr|pl|pr|left|right)-[0-9a-zA-Z]/,
  /\b(text-left|text-right)\b/,
  /\b(border-l|border-r)-[0-9a-zA-Z]/
];

scanDir(
  'src',
  file => file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.jsx'),
  file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      for (const pattern of physicalPatterns) {
        if (pattern.test(line)) {
          // Allow comments or explicitly excused lines if any
          if (!line.includes('/* excuse-physical */') && !line.includes('// excuse-physical')) {
            console.error(`❌ PHYSICAL DIRECTION UTILITY in ${file}:${idx + 1}: ${line.trim()}`);
            console.error(`   👉 Use logical utilities instead (ms-, me-, ps-, pe-, start-, end-, text-start, text-end)`);
            failed = true;
          }
        }
      }
    });
  }
);

if (failed) {
  console.error("\n❌ Honesty / RTL checks failed!");
  process.exit(1);
} else {
  console.log("✅ Honesty & RTL discipline checks passed!");
}
