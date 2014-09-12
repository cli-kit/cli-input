var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

var name = require('path').basename(process.argv[1]);

/**
 *  Collate multiple prompts into an object.
 */
var username = definitions.question.clone(
  {key: 'username', parameters: ['what is your username']});
var email = definitions.question.clone(
  {key: 'email', parameters: ['what is your email']});
username.required = email.required = true;
username.repeat = email.repeat = true;

var set = [username, email];
var ps = prompt();
ps.run(set, function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    for(var k in res.map) {
      console.log('%s | %s: %s', name, k, res.map[k]);
    }
  }
  process.exit(err ? 1 : 0);
});
