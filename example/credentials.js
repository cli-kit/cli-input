var prompt = require('..')
  , sets = prompt.sets;

/**
 *  A series of prompts to collect username and password credentials.
 */
var ps = prompt();
ps.run(sets.userpass, function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    //console.dir(res);
    console.log('credentials: %s:%s', res.map.name, res.map.pass);
  }
  process.exit(err ? 1 : 0);
});
