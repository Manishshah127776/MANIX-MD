const pkg = require(process.argv[2]);
const required = [
  'default',
  'makeWASocket',
  'useMultiFileAuthState',
  'DisconnectReason',
  'fetchLatestBaileysVersion',
  'jidDecode',
  'downloadContentFromMessage',
  'makeInMemoryStore',
  'generateWAMessageContent',
  'makeCacheableSignalKeyStore',
  'Browsers',
  'delay',
  'proto',
  'getContentType',
  'areJidsSameUser',
  'generateWAMessage',
  'extractMessageContent',
  'jidNormalizedUser',
  'downloadMediaMessage',
  'getAggregateVotesInPollMessage',
  'generateWAMessageFromContent',
  'prepareWAMessageMedia',
  'getDevice'
];
const result = Object.fromEntries(required.map((name) => [name, typeof pkg[name]]));
console.log(JSON.stringify({
  packagePath: require.resolve(process.argv[2]),
  exports: Object.keys(pkg).length,
  required: result,
  missing: required.filter((name) => !(name in pkg))
}, null, 2));
