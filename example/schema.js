var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions

var name = require('path').basename(process.argv[1]);

/**
 *  A prompt that validates against a schema.
 */

var schema = {
  name: {type: 'string'},
  email: {type: 'string'},
  updates: {type: 'boolean'},
}

var set = [], msg = '%s:';
var nm = definitions.question.clone(
  {
    key: 'name',
    parameters: ['enter your name'],
    message: msg,
    required: true,
    repeat: true
  }
);

var em = definitions.question.clone(
  {
    key: 'email',
    parameters: ['enter your email'],
    message: msg,
    required: true,
    repeat: true
  }
);

var up = definitions.question.clone(
  {
    key: 'updates',
    parameters: ['subscribe to updates'],
    default: 'false'
  }
);

set.push(nm, em, up);

// enable native types
var ps = prompt({native: {}});

ps.run(set, {schema: schema}, function(err, res) {
  if(res && res.map) {
    var k, v;
    for(k in res.map) {
      v = res.map[k];
      console.log('%s | %s: %s', name, k, v);
    }
  }
  process.exit(0);
});
