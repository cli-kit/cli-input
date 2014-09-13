var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions
  , ttycolor = require('ttycolor').defaults();

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

function find(key, list) {
  list = list || [];
  var i, v;
  for(i = 0;i < list.length;i++) {
    v = list[i];
    if(v && v.key === key) {
      return v;
    }
  }
}

// enable native types
var ps = prompt({native: {}});

ps.on('error', function onerror(err, errors, fields, res) {
  console.error('%s ! %s', name, err.message);

  // fields that generated an error
  var errs = Object.keys(fields);

  // we are going to show the set again on validation
  // error so let's update the default values for those fields
  // that did not generate an error
  var k, v;
  for(k in res.map) {
    v = find(k, set);
    if(v && !~errs.indexOf(k)) {
      v.default = res.map[k];
    }
  }

  // show the entire set again
  run();
})

function run() {
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
}

run();
