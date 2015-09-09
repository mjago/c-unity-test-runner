var flags = {
  'repeats': 1
  //  , 'showExc':   true
  //  , 'debug': true
  //  , 'scan': true
  //  , 'voidFound': true
  //  , 'count': true
  //  , trace: true
  //  , log_close: true
  //  , log_exit: true
  //  , log_run: true
  //  , log_clean: true
  //  , log_build: true
  , log_timers: true
};

exports.trace = flags.trace;
exports.flags = flags;
exports.repeats = function()
{
  return flags.debug ? flags.repeats : 1;
};

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

exports.voidFound = function(buffer) {
  if(flags.debug && flags.voidFound) {
    console.log('voidFound', 'buffer:', buffer);
  }
};

exports.scan = function(buffer) {
  if(flags.debug && flags.scan) {
    console.log('scan', 'buffer:', buffer);
  }
};
