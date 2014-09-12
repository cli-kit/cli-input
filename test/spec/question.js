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

  it('should show question prompt', function(done) {
    var output = fsutil.getWriteStream('default-question.txt');
    var def = definitions.question.clone();
    def.parameters = ['how would you like that'];
    var sequence = [
      {
        msg: 'how would you like that? ',
        input: 'spicy please',
        cb: function(res, evt, value, options, ps) {
          //delete sets.question[0].parameters;
          expect(res.isPromptEqual()).to.eql(true);
          expect(value).to.eql('spicy please');
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
