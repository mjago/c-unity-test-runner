module.exports = TestDetails;

function TestDetails(name) {
  this.results = [];
  this.outBuf = '';
  this.fileName = name;
  this.lineNum;
  this.testName;
  this.expected;
  this.actual;
  this.actualResult;
  this.testResult;
  this.message;
  this.hint;
}

reset = function(){
};

TestDetails.prototype.reset = function() {
  this.lineNum      = '';
  this.testName     = '';
  this.expected     = '';
  this.actual       = '';
  this.actualResult = '';
  this.testResult   = '';
  this.message      = '';
  this.hint         = '';
};
