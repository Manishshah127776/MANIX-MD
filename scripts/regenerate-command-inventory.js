const fs = require('fs');

const sourcePath = process.argv[2] || 'drenox.js';
const inventoryPath = process.argv[3] || 'command_inventory.json';
const source = fs.readFileSync(sourcePath, 'utf8');
const labels = [...source.matchAll(/\bcase\s+(['"])([^'"]+)\1\s*:/g)].map((match) => match[2]);
const unique = [...new Set(labels)];
const duplicateLabels = [...new Set(labels.filter((label, index) => labels.indexOf(label) !== index))];
const aliasBlock = source.match(/const COMMAND_ALIASES\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/);
const aliases = {};
if (aliasBlock) {
  for (const match of aliasBlock[1].matchAll(/^\s*([A-Za-z0-9_-]+):\s*['"]([^'"]+)['"],?\s*$/gm)) {
    aliases[match[1]] = match[2];
  }
}
const inventory = {
  totalLabels: labels.length,
  uniqueLabels: unique.length,
  duplicateLabels,
  labels: unique,
  aliases
};
fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
console.log(JSON.stringify({
  totalLabels: inventory.totalLabels,
  uniqueLabels: inventory.uniqueLabels,
  duplicateLabels: inventory.duplicateLabels,
  aliasCount: Object.keys(aliases).length
}, null, 2));
if (duplicateLabels.length) process.exitCode = 1;
