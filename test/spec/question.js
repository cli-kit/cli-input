var expect = require('chai').expect;
var mock = require('../util/mock');
var fsutil = require('../util/fsutil');
var prompt = require('../..')
  , sequencer = require('../../sequencer')
  , fsutil = require('../util/fsutil')
  , sets = prompt.sets;

describe('cli-input:', function() {
  this.timeout(5000);
  var ps, seq;

  it('should show question prompt', function(done) {
    var output = fsutil.getWriteStream('default-question.txt');
    sets.question[0].parameters = ['how would you like that'];
    var sequence = [
      {
        msg: 'how would you like that? ',
        input: 'spicy please',
        cb: function(res, evt, value, options, ps) {
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
    seq.run(sequence, sets.question);
  });
});
