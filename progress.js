var ProgressBar = require('progress');
var bar;
var width;

try{
var window_width = process.stdout.getWindowSize
    ? process.stdout.getWindowSize(1)[0]
    : tty.getWindowSize()[1];
  width = window_width * .50 | 0;
} catch(e){
  width = 100;
}

exports.init_bar = function(count){
  bar = new ProgressBar('  [:bar] :elapsed ', {
    total: count * 7,
    incomplete: '․',
    complete:   '▬',
    width: width});
};

exports.tick = function() {
  bar.tick();
};
