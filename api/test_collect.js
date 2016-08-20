var mocha  = require('mocha');
var chai   = require('chai');
var assert = chai.assert;

var engine = require("seneca")();
var cfg = require("./gcc.js");
engine.use( "./collect.js");

describe('test assert setup', function() {
  it('should assert 1', function(){
    assert.deepEqual(1,1);
  });

  describe('collect responds positively to action', function() {
    it('should not return error', function(){
      engine.act({cmd: 'collect'},function(err, response) {
        assert.deepEqual(null, err);
      });
    });

    it('should return gcc', function(){
      engine.act({cmd: 'collect'},function(err, response) {
        assert.deepEqual('gcc', response.args[0]);
      });
    });
    it('should return compiler arguments', function(){
      engine.act({cmd: 'collect'},function(err, response) {
        assert.deepEqual('-DUNITY_INCLUDE_DOUBLE', response.args[1][0]);
        assert.deepEqual('-DUNITY_SUPPORT_TEST_CASES', response.args[1][1]);
        assert.deepEqual('-DUNITY_SUPPORT_64', response.args[1][2]);
      });
    });
    it('should return output filename as last parameter', function(){
      engine.act({cmd: 'collect'},function(err, response) {

        assert.deepEqual('-o/Users/martyn/_unity_quick_setup/dev/Unity/test/build/unity.o', response.args[1][38]);
      });
    });
  });
});
