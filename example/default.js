var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

var name = require('path').basename(process.argv[1]);

/**
 *  A simple question/answer prompt that configures
 *  a default value to use when no input is received.
 */
var def = definitions.question.clone();
def.parameters = ['how would you like that'];
def.default = 'spicy';
var ps = prompt();
ps.run([def], function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    var val = res.map.question;
    console.info('%s | answer: "%s"', name, val);
  }
  process.exit(err ? 1 : 0);
});
