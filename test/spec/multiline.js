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

  it('should capture multiline input with no newlines', function(done) {
    var output = fsutil.getWriteStream('multiline-no-newline.txt');
    var input = 'lorem';
    var expected = {
      lines: [input],
      raw: input
    }
    var sequence = {multiline: true, input: input};
    ps = prompt({name: mock.name, output: output});
    seq = new sequencer({ps: ps, output: output});
    seq.multiline(sequence, function(err, lines, raw) {
      //console.dir(lines);
      //console.dir(raw);
      expect(lines).to.eql(expected.lines);
      expect(raw).to.eql(expected.raw);
      done();
    });
  });

  it('should capture multiline input', function(done) {
    var output = fsutil.getWriteStream('multiline.txt');
    var input = 'lorem\nipsum\ndolor';
    var expected = {
      lines: input.split('\n'),
      raw: input
    }
    var sequence = {multiline: true, input: input};
    ps = prompt({name: mock.name, output: output});
    seq = new sequencer({ps: ps, output: output});
    seq.multiline(sequence, function(err, lines, raw) {
      //console.dir(lines);
      //console.dir(raw);
      expect(lines).to.eql(expected.lines);
      expect(raw).to.eql(expected.raw);
      done();
    });
  });

  it('should capture multiline input trailing newline', function(done) {
    var output = fsutil.getWriteStream('multiline-trailing-newline.txt');
    var input = 'lorem\nipsum\ndolor\n';
    var expected = {
      lines: input.split('\n'),
      raw: input
    }
    var sequence = {multiline: true, input: input};
    ps = prompt({name: mock.name, output: output});
    seq = new sequencer({ps: ps, output: output});
    seq.multiline(sequence, function(err, lines, raw) {
      expect(lines).to.eql(expected.lines);
      expect(raw).to.eql(expected.raw);
      done();
    });
  });
});
