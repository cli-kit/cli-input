var expect = require('chai').expect;
var mock = require('../util/mock');
var fsutil = require('../util/fsutil');
var prompt = require('../..')
  , sequencer = require('../../lib/sequencer')
  , fsutil = require('../util/fsutil')
  , sets = prompt.sets
  , definitions = sets.definitions;

describe('cli-input:', function() {
  this.timeout(5000);
  var ps, seq;

  it('should use default value on no input', function(done) {
    var output = fsutil.getWriteStream('default-value.txt');
    var def = definitions.question.clone();
    def.default = 'default-value';
    def.parameters = ['default prompt'];
    var sequence = [
      {
        msg: 'default prompt? (default-value) ',
        input: '',
        cb: function(res, evt, value, options, ps) {
          expect(res.isPromptEqual()).to.eql(true);
          expect(value).to.eql(def.default);
          expect(evt).to.eql('value');
          done();
        }
      }
    ];
    ps = prompt({name: mock.name, output: output});
    ps.use({colors: false});
    seq = new sequencer({ps: ps, output: output});
    seq.run(sequence, [def]);
  });
});
