var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

var name = require('path').basename(process.argv[1]);

/**
 *  A silent prompt to collect a password.
 */
var def = definitions.password.clone();
var ps = prompt();
ps.on('empty', function() {
  console.error('%s ! you must enter a password', name);
})
ps.run([def], function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    console.log('%s | password: %s', name, res.map.pass);
  }
  process.exit(err ? 1 : 0);
});
