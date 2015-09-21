var fs              = require('fs');
var dbg             = require('./debug.js');

exports.clean = function(path){
  rmDir(path);
};

function rmDir(dirPath, removeSelf) {
  removeself = isRemoveSelf(removeSelf);
  try {
    var files = getFileNames(dirPath);
  }
  catch(e) {
    return;
  }
  rmRecurse(files, dirPath, removeSelf);
};

function isRemoveSelf(removeSelf) {
  return (removeSelf === undefined);
}

function rmRecurse(files, dirPath, removeSelf) {
  if( ! files.length > 0) return;

  files.map(function(val) {
    dbg.log('clean', 'cleaning ' + val);
    rmFileOrDir(filePath(dirPath, val));
  });

  if(removeSelf) fs.rmdirSync(dirPath);
}

function getFileNames(path) {
  return fs.readdirSync(path);
}

function rmFileOrDir(path) {
  if(isFile(path)) rmFile(path);
  else rmDir(path);
}

function isFile(path) {
  return fs.statSync(path).isFile();
}

function filePath(dirPath, file) {
  return dirPath + '/' + file;
}

function rmFile(file) {
  fs.unlinkSync(file);
}
