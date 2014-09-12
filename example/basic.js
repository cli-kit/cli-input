var prompt = require('..');
var name = require('path').basename(process.argv[1]);

/**
 *  A basic prompt that shows the default behaviour
 *  with no options set.
 */
var ps = prompt();
ps.prompt(function(err, val) {
  console.log('%s | you typed: "%s"', name, val);
  process.exit(0);
});
