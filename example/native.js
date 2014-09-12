var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions;

var repeat = require('cli-util').repeat;
var delim = repeat(80, '+');

/**
 *  Coerce received input to native types.
 */

console.log('native: send SIGINT (Ctrl^C) to exit');
console.log(delim);
console.warn('primitives: null, undefined, true, false, 1024, 1.67, value');
console.warn('arrays: 1,2,3');
console.warn('json: {"key": "value"}');
console.log(delim);

var type = definitions.question.clone(
  {key: 'type', parameters: ['enter a javascript type']});

type.required = true;
type.repeat = true;

var set = [type];
var ps = prompt({infinite: true, native: {delimiter: ',', json: true}});
ps.run(set, function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    var k, v;
    for(k in res.map) {
      v = res.map[k];
      console.log('%s: %j (%s)', k, v, Array.isArray(v) ? 'array' : typeof(v));
    }
  }
});
