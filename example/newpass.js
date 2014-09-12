var prompt = require('..')
  , sets = prompt.sets;

var name = require('path').basename(process.argv[1]);

/**
 *  A series of prompts to collect a password and confirm
 *  the new password, if the passwords do not match the prompt
 *  set is repeated until the passwords do match.
 */
var ps = prompt();
ps.on('mismatch', function() {
  console.error('%s ! passwords do not match', name);
})
ps.run(sets.newpass, function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    console.log('%s | password: %s', name, res.map.pass);
  }
  process.exit(err ? 1 : 0);
});
