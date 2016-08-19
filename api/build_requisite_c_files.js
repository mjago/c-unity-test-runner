var path = require('path');

module.exports = function(options){

  this.add({cmd: 'buildRequisiteCFiles'},  buildRequisiteCFiles);

  function buildRequisiteCFiles(msg, respond){
    var details = [];
    var basename;
    //  console.log('data.includedCFiles', data.includedCFiles)
    if(msg.includedCFiles.length < 1){
      respond('No included requisite C files!', null);
      //      console.log('NO FILES');
    }
    else {
      msg.includedCFiles.map(function(inc){
//        console.log('inc',inc);
        basename = path.basename(inc, '.c');
        details.push(msg.cfg.compilerExec);
        details.push(requisiteCArgs(msg.cfg, basename));
        details.push(runnerExecArgs());
        spawner.run(details, basename, 0, resolve);
      });
    }
//  });
//  data.includedCFiles = [];
//}

    respond(null, {args: details, basename: basename});
  }

  function requisiteCArgs(cfg, cFile){
    details = [cfg.compiler.source_files.path + cFile + '.c']
      .concat(includes(cfg, defines(cfg)))
      .concat(testDefine(cfg))
      .concat(cfg.compilerOptions)
      .concat([cfg.compiler.build_path + cFile + '.o']);
    return details;
  }

  function includes(cfg, args){
    return args.concat(args, cfg.includesItems
                       .map(function(cV){
                         return(cfg.includesPrefix + cV);
                       }));
  }

  function defines(cfg){
    return cfg.definesItems.map(function(cV){
      return(cfg.definesPrefix + cV);
    });
  }

  function testDefine(cfg){
    return [cfg.definesPrefix +
            cfg.compiler.test_define];
  }

  function runnerExecOutput(args) {
    console.log( "pushing ofbjcet prefix")
    args.push(cfg.objectPrefix +
              cfg.compilerBuildPath +
              cfg.runner.object);
    return args;
  }

  function runnerExecSource(args) {
    args.push(cfg.runner.source_path + cfg.runner.sourceName);
    return args;
  }

  function runnerExecArgs(){
    return runnerExecOutput(runnerExecSource(options(includes(defines()))));
  }

  function options(args){
    return args.concat(args, cfg.compilerOptions
                       .map(function(cV){return cV;}));
  }

  function includes(args){
    return args.concat(args, cfg.includesItems
                       .map(function(cV){
                         return(cfg.includesPrefix + cV);
                       }));
  }

  function defines(){
    return cfg.definesItems.map(function(cV){
      return(cfg.definesPrefix + cV);
    });
  }


};

