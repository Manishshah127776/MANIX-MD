const fs = require('fs');
const source = fs.readFileSync(process.argv[2], 'utf8');
const labels = [];
const regex = /\bcase\s+(['"`])([^'"`]+)\1\s*:/g;
let match;
while ((match = regex.exec(source))) labels.push(match[2]);
const counts = new Map();
for (const label of labels) counts.set(label, (counts.get(label) || 0) + 1);
const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
const inventory = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const missingFromSource = inventory.labels.filter((label) => !counts.has(label));
const extraInSource = [...counts.keys()].filter((label) => !inventory.labels.includes(label));
console.log(JSON.stringify({
  sourceLabels: labels.length,
  sourceUniqueLabels: counts.size,
  sourceDuplicates: duplicates,
  inventoryTotalLabels: inventory.totalLabels,
  inventoryUniqueLabels: inventory.uniqueLabels,
  inventoryDuplicates: inventory.duplicateLabels,
  missingFromSource,
  extraInSource
}, null, 2));
if (duplicates.length || missingFromSource.length || extraInSource.length) process.exitCode = 1;
