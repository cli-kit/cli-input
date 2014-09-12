var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

var name = require('path').basename(process.argv[1]);

var repeat = require('cli-util').repeat;
var delim = repeat(80, '+');

/**
 *  Coerce received input to native types.
 */

console.log('%s | send SIGINT (Ctrl^C) to exit', name);
console.log(delim);
console.log('primitives: null, undefined, true, false, 1024, 1.67, value');
console.log('arrays: 1,2,3');
console.log('json: {"key": "value"}');
console.log(delim);

var type = definitions.question.clone(
  {
    key: 'type',
    parameters: ['enter a javascript type'],
    required: true,
    repeat: true
  }
);

var set = [type];
var ps = prompt({infinite: true, native: {delimiter: ',', json: true}});
ps.run(set, function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    var k, v;
    for(k in res.map) {
      v = res.map[k];
      console.log('%s | %s: %j (%s)',
        name, k, v, Array.isArray(v) ? 'array' : typeof(v));
    }
  }
});
