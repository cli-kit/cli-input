var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

var name = require('path').basename(process.argv[1]);

/**
 *  A simple confirmation prompt.
 */
var def = definitions.confirm.clone();
var ps = prompt();
ps.on('unacceptable', function() {
  console.error('%s ! expects y/n or yes/no', name);
})
ps.run([def], function(err, res) {
  if(err) console.error(err);
  if(res && res.map && res.map.confirm) {
    console.log('%s | accepted: %s', name, res.map.confirm.accept);
  }
  process.exit(err ? 1 : 0);
});
