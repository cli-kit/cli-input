var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions
  , colors = require('./colors');

/**
 *  A silent prompt to collect a password with ANSI escape sequences.
 *
 *  Enables verification of:
 *
 *  https://github.com/isaacs/mute-stream/issues/3
 *
 *  Run and enter a password then press the backspace key.
 *
 *  node example/ansi-password.js
 *
 *  Expected behaviour: the asterisk is deleted.
 *
 *  Set NODE_ENV (loads mute-stream module instead):
 *
 *  NODE_ENV=test-mute node example/ansi-password.js
 *
 *  Expected behaviour: the plain text password is revealed.
 */
var def = definitions.password.clone();
var ps = prompt({colors: colors});
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
