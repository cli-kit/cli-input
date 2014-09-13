var prompt = require('..')
  , completer = require('./completer');
var name = require('path').basename(process.argv[1]);

/**
 *  A example of using tab completion.
 */
console.log('%s | send SIGINT (Ctrl^C) to exit', name);
console.log('%s | hit the tab key to see possible completions', name);
var ps = prompt({infinite: true, completer: completer});
ps.on('value', function(val, options, ps) {
  console.log('%s | got command: %j', name, val);
})
ps.run();
