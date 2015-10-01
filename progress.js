var ProgressBar = require('progress');
var cfg         = require("./gcc.js");
var bar;

exports.init = function(count){
  if(cfg.noBar) return;
  var width;

  try{
    var window_width = process.stdout.getWindowSize
          ? process.stdout.getWindowSize(1)[0]
          : tty.getWindowSize()[1];
    width = window_width * 0.495 | 0;
  } catch(e){
    width = 100;
  }

  bar = new ProgressBar('  [:bar] :elapsed ', {
    total: count * 7,
    incomplete: '․',
    complete:   '▬',
    width: width});
};

exports.update = function(id, args){
  if(cfg.noBar) return;
  if(id == 'spawner' &&((args < 1) || (args > 3))) return;
  bar.tick();
};
