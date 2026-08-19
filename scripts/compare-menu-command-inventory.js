#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const [, , menuPath, inventoryPath] = process.argv
if (!menuPath || !inventoryPath) {
  console.error('Usage: node scripts/compare-menu-command-inventory.js <menu.txt> <inventory.json>')
  process.exit(2)
}

const map = {
  'ᴀ': 'a', 'ʙ': 'b', 'ᴄ': 'c', 'ᴅ': 'd', 'ᴇ': 'e', 'ғ': 'f', 'ꜰ': 'f', 'ɢ': 'g',
  'ʜ': 'h', 'ɪ': 'i', 'ᴊ': 'j', 'ᴋ': 'k', 'ʟ': 'l', 'ᴍ': 'm', 'ɴ': 'n', 'ᴏ': 'o',
  'ᴘ': 'p', 'ǫ': 'q', 'ʀ': 'r', 'ꜱ': 's', 'ᴛ': 't', 'ᴜ': 'u', 'ᴠ': 'v', 'ᴡ': 'w',
  'x': 'x', 'ʏ': 'y', 'ᴢ': 'z', '𝟶': '0', '𝟷': '1', '𝟸': '2', '𝟹': '3',
  '𝟺': '4', '𝟻': '5', '𝟼': '6', '𝟽': '7', '𝟾': '8', '𝟿': '9'
}

function normalize(value) {
  return String(value)
    .normalize('NFKC')
    .split('')
    .map(char => map[char] || char)
    .join('')
    .toLowerCase()
    .replace(/^\./, '')
    .trim()
}

const menu = fs.readFileSync(path.resolve(menuPath), 'utf8')
const inventory = JSON.parse(fs.readFileSync(path.resolve(inventoryPath), 'utf8'))
const sourceLabels = (inventory.labels || inventory.commandLabels || []).map(normalize)
const sourceSet = new Set(sourceLabels)
const aliases = inventory.aliases || {}
const aliasSet = new Set(Object.keys(aliases).map(normalize))
const resolvableSet = new Set([...sourceSet, ...aliasSet])
const rawCommands = [...menu.matchAll(/\.([^\s│└├╰╭╮━—]+)/gu)].map(match => match[1])
const menuLabels = rawCommands.map(normalize).filter(Boolean)
const menuSet = new Set(menuLabels)
const duplicateMenu = [...menuSet].filter(label => menuLabels.filter(item => item === label).length > 1)
const displayArtifacts = new Set(['0*', 'runway<prompt>'])
const missingFromSource = [...menuSet]
  .filter(label => !resolvableSet.has(label) && !displayArtifacts.has(label))
  .sort()
const ignoredDisplayArtifacts = [...menuSet].filter(label => displayArtifacts.has(label)).sort()
const sourceNotInMenu = [...sourceSet].filter(label => !menuSet.has(label)).sort()

console.log(JSON.stringify({
  menuRawEntries: rawCommands.length,
  menuUniqueLabels: menuSet.size,
  menuDuplicates: duplicateMenu,
  inventoryUniqueLabels: sourceSet.size,
  aliasCount: aliasSet.size,
  missingFromSource,
  ignoredDisplayArtifacts,
  sourceNotInMenuCount: sourceNotInMenu.length,
  sourceNotInMenu: sourceNotInMenu
}, null, 2))
if (missingFromSource.length) process.exitCode = 1
