const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const importFiles = [
  'allfunc/Data1.js',
  'allfunc/myfunc1.js',
  'allfunc/myfunc3.js',
  'allfunc/myfunc4.js',
  'allfunc/myfunction.js',
  'allfunc/storage.js',
  'drenox.js',
  'manixmdstorage/myfunc.js',
  'manixmdstorage/oke.js',
  'pair.js',
  'web-pair.js'
];

for (const relative of importFiles) {
  const file = path.join(root, relative);
  const original = fs.readFileSync(file, 'utf8');
  const updated = original.replaceAll('@whiskeysockets/baileys', 'malvin-baileys');
  if (updated === original) throw new Error(`No Baileys import replacement made in ${relative}`);
  fs.writeFileSync(file, updated);
}

const drenoxPath = path.join(root, 'drenox.js');
const drenox = fs.readFileSync(drenoxPath, 'utf8');
const oldHelper = `const areJidsSameUser = (jid1, jid2) => {\n  try {\n    return require('malvin-baileys').areJidsSame(jid1, jid2)\n  } catch {\n    return isSameUser(jid1, jid2)\n  }\n}`;
const newHelper = `const areJidsSameUser = (jid1, jid2) => {\n  try {\n    const baileysAreSame = require('malvin-baileys').areJidsSameUser\n    return typeof baileysAreSame === 'function' ? baileysAreSame(jid1, jid2) : isSameUser(jid1, jid2)\n  } catch {\n    return isSameUser(jid1, jid2)\n  }\n}`;
if (!drenox.includes(oldHelper)) throw new Error('Expected drenox areJidsSame compatibility helper was not found');
fs.writeFileSync(drenoxPath, drenox.replace(oldHelper, newHelper));

const packagePath = path.join(root, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.dependencies = packageJson.dependencies || {};
delete packageJson.dependencies['@whiskeysockets/baileys'];
packageJson.dependencies['malvin-baileys'] = '2.2.5';
packageJson.engines = { ...(packageJson.engines || {}), node: '>=20.0.0' };
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

const patchPath = path.join(root, 'scripts/patch-baileys-405.js');
let patch = fs.readFileSync(patchPath, 'utf8');
patch = patch.replaceAll("'@whiskeysockets', 'baileys'", "'malvin-baileys'");
patch = patch.replace("[baileys-405]", "[malvin-baileys-405]").replaceAll("[baileys-405]", "[malvin-baileys-405]");
fs.writeFileSync(patchPath, patch);

const testPath = path.join(root, 'scripts/test-multi-device.js');
let test = fs.readFileSync(testPath, 'utf8').replace("packageJson.dependencies?.['@whiskeysockets/baileys']", "packageJson.dependencies?.['malvin-baileys']");
test = test.replace('Baileys dependency is present', 'malvin-baileys dependency is present');
fs.writeFileSync(testPath, test);

const readmePath = path.join(root, 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8').replaceAll('@whiskeysockets/baileys', 'malvin-baileys');
fs.writeFileSync(readmePath, readme);

console.log(`Migrated ${importFiles.length} source files to malvin-baileys@2.2.5.`);
