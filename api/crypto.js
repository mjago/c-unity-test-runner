const crypto = require("crypto");
const fs = require("fs");
var hash = crypto.createHash("sha256")
//      .update("Man oh man do I love node!")
//      .digest("hex");

var second = crypto.createHash("sha256")
      .update("Man oh man do I love node!")
      .digest("hex");


function readHash(filename) {
  var hash = crypto.createHash("sha256")
  const input = fs.createReadStream(filename);
  input.on('readable', () => {
    var data = input.read();
    if(data)
      hash.update(data);
    else {
      console.log(`${hash.digest('hex')} ${filename}`);
    }
  });
}

for(var i = 0; i < 2556; i++) {
  readHash("src/a.c");
  readHash("src/b.c");
  readHash("src/c.c");
  readHash("src/d.c");
}
