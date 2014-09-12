var expect = require('chai').expect;
var fs = require('fs');
var mock = require('../util/mock');
var fsutil = require('../util/fsutil');
var EOL = require('os').EOL;
var prompt = require('../..')
  , sequencer = require('../../sequencer')
  , sets = prompt.sets;

//process.stdin.resume();

describe('cli-input:', function() {
  this.timeout(5000);

  var ps, seq;

  it('should show binary confirm prompt (reject)', function(done) {
    var sequence = [
      {
        msg: 'are you sure? (y/n) ',
        input: 'n',
        cb: function(res, evt, value, options, ps) {
          // check the displayed prompt matches our defined sequence *msg*
          expect(res.isPromptEqual()).to.eql(true);
          expect(value.result).to.eql('n');
          expect(value.accept).to.eql(false);
          expect(evt).to.eql('binary');
          done();
        }
      }
    ];
    ps = prompt({name: mock.name});
    seq = new sequencer({ps: ps});
    seq.run(sequence, sets.confirm);
  });
});
