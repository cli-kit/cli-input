var prompt = require('..');

/**
 *  A basic prompt that shows the default behaviour
 *  with no options set.
 */
var ps = prompt();
ps.prompt(function(err, val) {
  console.log('you typed: "%s"', val);
  process.exit(0);
});
