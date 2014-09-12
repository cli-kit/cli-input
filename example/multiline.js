var prompt = require('..');
var name = require('path').basename(process.argv[1]);

/**
 *  Collect input into a multiline string.
 */
console.log('%s | type a message (finish with Ctrl^D):', name);
var ps = prompt();
ps.multiline(function(err, lines, raw) {
  console.log('%s | you typed: "%s"', name, raw);
  process.exit(0);
});
