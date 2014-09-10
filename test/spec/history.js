var expect = require('chai').expect;
var mock = require('../util/mock');
var fsutil = require('../util/fsutil');
var EOL = require('os').EOL;
var input= require('../..')
  , history = input.history
  , History = input.History;

//var h = history({file: process.env.HOME + '/.rlx/.history'},
  //function(err, store, hs) {
    //if(err) return console.error(err);
    ////console.log('loaded history');
    ////console.dir(hs.getStore());

    //store.add('line item, random: ' + Math.random(), function(err, store) {
      ////console.log('added item: %s', store);
      //console.log('isFlushed: %s', store.isFlushed());
      //console.dir(hs.getStore());
      ////store.clear(function() {
        ////console.log('after clear isFlushed: %s', store.isFlushed());
        ////console.dir(hs.getStore());
      ////})
    //});
  //}
//);

describe('cli-input:', function() {
  var stash;

  it('should create history instance', function(done) {
    var h = history({});
    expect(h).to.be.instanceof(History);
    done();
  });

  it('should create history file', function(done) {
    history({file: mock.file}, function(err, store, history) {
      stash = store;
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql('');
      done();
    });
  });

  it('should add history line', function(done) {
    stash.add(mock.lines[0], function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(mock.lines[0] + EOL);
      done();
    })
  });

  it('should ignore duplicate line', function(done) {
    stash.add(mock.lines[0], function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(mock.lines[0] + EOL);
      done();
    })
  });

  it('should clear history file', function(done) {
    stash.clear(function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql('');
      done();
    })
  });
});
