var prompt = require('..')
  , sets = prompt.sets;

/**
 *  A series of prompts to collect a password and confirm
 *  the new password, if the passwords do not match the prompt
 *  set is repeated until the passwords do match.
 */
var ps = prompt();
ps.on('mismatch', function() {
  console.error('error: passwords do not match');
})
ps.run(sets.newpass, function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    console.log('password: %s', res.map.pass);
  }
  process.exit(err ? 1 : 0);
});
