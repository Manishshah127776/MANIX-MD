const COMMAND_CHAR_MAP = {
  'ᴀ': 'a', 'ʙ': 'b', 'ᴄ': 'c', 'ᴅ': 'd', 'ᴇ': 'e', 'ғ': 'f', 'ꜰ': 'f',
  'ɢ': 'g', 'ʜ': 'h', 'ɪ': 'i', 'ᴊ': 'j', 'ᴋ': 'k', 'ʟ': 'l', 'ᴍ': 'm',
  'ɴ': 'n', 'ᴏ': 'o', 'ᴘ': 'p', 'ǫ': 'q', 'ʀ': 'r', 'ꜱ': 's', 'ᴛ': 't',
  'ᴜ': 'u', 'ᴠ': 'v', 'ᴡ': 'w', 'ʏ': 'y', 'ᴢ': 'z'
};

const normalize = (value) => String(value)
  .normalize('NFKC')
  .split('')
  .map((character) => COMMAND_CHAR_MAP[character] || character)
  .join('')
  .toLowerCase();

const checks = {
  'spotiғy': normalize('spotiғy'),
  'ғlux': normalize('ғlux'),
  'ᴀʟʟᴍᴇɴᴜ': normalize('ᴀʟʟᴍᴇɴᴜ')
};
console.log(JSON.stringify(checks, null, 2));
if (checks['spotiғy'] !== 'spotify' || checks['ғlux'] !== 'flux' || checks['ᴀʟʟᴍᴇɴᴜ'] !== 'allmenu') {
  process.exitCode = 1;
}
