var expect = require('chai').expect;
var mock = require('../util/mock');
var fsutil = require('../util/fsutil');
var prompt = require('../..')
  , sequencer = require('../../lib/sequencer')
  , fsutil = require('../util/fsutil')
  , sets = prompt.sets;

describe('cli-input:', function() {
  this.timeout(5000);
  var ps, seq;

  it('should show binary confirm prompt (reject)', function(done) {
    var output = fsutil.getWriteStream('confirm-reject.txt');
    var sequence = [
      {
        msg: 'are you sure? (y/n) ',
        input: 'n',
        cb: function(res, evt, value, options, ps) {
          expect(res.isPromptEqual()).to.eql(true);
          expect(value.result).to.eql('n');
          expect(value.accept).to.eql(false);
          expect(evt).to.eql('binary');
          done();
        }
      }
    ];
    ps = prompt({name: mock.name, output: output});
    seq = new sequencer({ps: ps, output: output});
    seq.run(sequence, sets.confirm);
  });

  it('should show binary confirm prompt (accept)', function(done) {
    var output = fsutil.getWriteStream('confirm-accept.txt');
    var sequence = [
      {
        msg: 'are you sure? (y/n) ',
        input: 'y',
        cb: function(res, evt, value, options, ps) {
          expect(res.isPromptEqual()).to.eql(true);
          expect(value.result).to.eql('y');
          expect(value.accept).to.eql(true);
          expect(evt).to.eql('binary');
          done();
        }
      }
    ];
    ps = prompt({name: mock.name, output: output});
    seq = new sequencer({ps: ps, output: output});
    seq.run(sequence, sets.confirm);
  });

});
