var expect = require('chai').expect;
var mock = require('../util/mock');
var fsutil = require('../util/fsutil');
var prompt = require('../..')
  , sequencer = require('../../lib/sequencer')
  , fsutil = require('../util/fsutil')
  , sets = prompt.sets
  , definitions = sets.definitions;


var options = [
  'Javascript',
  'Ruby',
  'Perl',
];

describe('cli-input:', function() {
  this.timeout(5000);
  var ps, seq;

  it('should select default option on empty input', function(done) {
    var output = fsutil.getWriteStream('select-option.txt');
    var opts = {list: options, default: 0};
    var def = definitions.option.clone();
    def.message = 'which language floats your boat (%s)?';
    def.parameters = ['1-' + options.length];
    // have to switch off repeat for tests
    def.repeat = false;
    opts.prompt = def;
    var sequence = [
      {
        msg: 'which language floats your boat (1-3)? ',
        input: '',
        evt: 'option',
        cb: function(res, evt, value, options, ps) {
          expect(res.isPromptEqual()).to.eql(true);
          expect(evt).to.eql('option');
        }
      }
    ];
    ps = prompt({name: mock.name, output: output});
    seq = new sequencer({ps: ps, output: output});
    seq.run(sequence, null, {select: opts}, function(err, res, index, line) {
      expect(err).to.eql(null);
      expect(res).to.be.an('object');
      expect(res.display).to.eql(1);
      expect(res.index).to.eql(0);
      expect(res.value).to.eql(options[0]);
      expect(index).to.eql(0);
      expect(line).to.eql('');
      done();
    });
  });
});
