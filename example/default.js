var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

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
    console.info('answer: "%s"', val);
  }
  process.exit(err ? 1 : 0);
});
