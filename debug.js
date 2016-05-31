var flags = {
  //  'repeats': 1
  //  , 'showExc':   true
  //, 'debug': true
  //  , 'scan': true
  //  , 'voidFound': true
  //'count': true
  //  , trace: true
  //  log_close: true
  // ,log_exit: true
  // , log_finish: true
  // , log_run: true
  // , clean: true
  // , log_build: true
  //, log_timers: true
  //  resultJS: true
};

exports.trace = flags.trace;
exports.flags = flags;

//exports.repeats = function()
//{
//  return flags.debug ? flags.repeats : 1;
//};

exports.count = function(count, final) {
  if(flags.debug && flags.count) {
    if(final) {
      console.log("\nTotal Parsed Tests:", count, '\n');
    }
    else if(count % flags.repeats === 0){
      console.log("Parsed Test:", count);
    }
  }
};

var printBufMaybe = function(flag, buffer){
  if(flags.debug && flags[flag]){
    console.log(flag, 'buffer:', buffer);
  }
};


exports.voidFound = function(buffer) {
  printBufMaybe('voidFound', buffer);
};

exports.scan = function(buffer) {
  printBufMaybe('scan', buffer);
};

exports.building = function(base) {
  if(flags.log_build){
    console.log('building', base);
  }
};

exports.finding = function(base) {
  if(flags.log_build){
    console.log('finding', base);
  }
};

exports.startTimer = function(base){
  if(flags.log_timers){
    console.time(base);
  }
};

exports.stopTimer = function(name) {
  if(flags.log_timers){
    console.timeEnd(name);
  }
};

exports.log = function(type, msg){
  if(flags[type])
    console.log(msg);
};
