var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

/**
 *  A silent prompt to collect a password.
 */
var def = definitions.password.clone();
var ps = prompt();
ps.on('empty', function() {
  console.error('error: you must enter a password');
})
ps.run([def], function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    console.log('password: %s', res.map.pass);
  }
  process.exit(err ? 1 : 0);
});
