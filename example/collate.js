var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

/**
 *  Collate multiple prompts into an object.
 */
var name = definitions.question.clone(
  {key: 'name', parameters: ['what is your name']});
var email = definitions.question.clone(
  {key: 'email', parameters: ['what is your email']});

name.required = email.required = true;
name.repeat = email.repeat = true;

var set = [name, email];
var ps = prompt();
ps.run(set, function(err, res) {
  if(err) console.error(err);
  if(res && res.map && res.map) {
    for(var k in res.map) {
      console.log('%s: %s', k, res.map[k]);
    }
  }
  process.exit(err ? 1 : 0);
});
