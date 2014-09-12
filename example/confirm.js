var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

/**
 *  A simple confirmation prompt.
 */
var def = definitions.confirm.clone();
var ps = prompt();
ps.on('unacceptable', function() {
  console.error('unacceptable: expects y/n or yes/no');
})
ps.run([def], function(err, res) {
  if(err) console.error(err);
  if(res && res.map && res.map.confirm) {
    console.log('accepted: %s', res.map.confirm.accept);
  }
  process.exit(err ? 1 : 0);
});
