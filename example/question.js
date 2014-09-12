var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

/**
 *  A simple question/answer prompt that expects an answer
 *  by setting required and repeat options.
 */
var def = definitions.question.clone();
def.parameters = ['how would you like that'];
def.repeat = true;
def.required = true;
var ps = prompt();
ps.on('empty', function() {
  console.error('error: not a rhetorical question (answer required)');
})
ps.run([def], function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    var val = res.map.question;
    console.info('answer: "%s"', val);
  }
  process.exit(err ? 1 : 0);
});
