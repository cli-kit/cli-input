var prompt = require('..');
var name = require('path').basename(process.argv[1]);

/**
 *  Collect input as JSON.
 */
console.log('%s | type a JSON string literal (finish with Ctrl^D):', name);
var ps = prompt();
var opts = {json: true};
ps.multiline(opts, function onlines(err, data) {
  if(err) {
    console.error('%s ! %s', name, err.message);
    process.exit(1);
  }
  console.log('%s | %j (%s)', name, data, typeof data);
  process.exit(0);
});
