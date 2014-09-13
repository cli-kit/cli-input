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

  it('should show infinite prompt', function(done) {
    var output = fsutil.getWriteStream('infinite.txt');
    var sequence = [
      {
        msg: '',
        input: 'pwd',
        cb: function(res, evt, value, options, ps) {
          expect(value).to.be.an('array');
          expect(value.length).to.eql(1);
          expect(value).to.eql(['pwd']);
        }
      },
      {
        msg: '',
        input: 'ls -la',
        cb: function(res, evt, value, options, ps) {
          expect(value).to.be.an('array');
          expect(value.length).to.eql(2);
          expect(value).to.eql(['ls', '-la']);
          done();
        }
      }
    ];

    ps = prompt({name: mock.name, output: output, infinite: true});
    seq = new sequencer({ps: ps, output: output});
    seq.run(sequence);
  });
});
