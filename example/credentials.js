var prompt = require('..')
  , sets = prompt.sets;

var name = require('path').basename(process.argv[1]);

/**
 *  A series of prompts to collect username and password credentials.
 */
var ps = prompt();
ps.run(sets.userpass, function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    console.log('%s | username: %s', name, res.map.name);
    console.log('%s | password: %s', name, res.map.pass);
  }
  process.exit(err ? 1 : 0);
});
