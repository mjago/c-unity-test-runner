var yaml = require('js-yaml'),
    cfg = {},
    fs = require('fs'),
    util = require('util'),

    loadYamlConfig = function(callback) {
      try {
        cfg = yaml.safeLoad(fs.readFileSync('./gcc_32.yml', 'utf8'));
        callback(null, cfg);
      } catch (e) {
        callback(e, null);
      }
    };

loadYamlConfig(function(err, cfg){
  if(err) {
    console.log('Error loading config: ', err);
    cfg = null;
    process.exit(1);
  }
  else {
//    cfg = data;
  }
});

cfg.mochaUI                 = cfg.mocha.ui;
cfg.mochaReporter           = cfg.mocha.reporter;
cfg.compilerExec            = cfg.compiler.path + cfg.compiler.exec;
cfg.linkerExec              = cfg.linker.path + cfg.linker.exec;
cfg.definesItems            = cfg.compiler.defines.items;
cfg.includesItems           = cfg.compiler.includes.items;
cfg.includesPrefix          = cfg.linker.includes.prefix;
cfg.definesPrefix           = cfg.compiler.defines.prefix;
cfg.objectPrefix            = cfg.compiler.object_files.prefix;
cfg.unitTestsPath           = cfg.compiler.unit_tests_path;
cfg.compilerOptions         = cfg.compiler.options;
cfg.compilerObjectFilesDest = cfg.compiler.object_files.destination;
cfg.compilerBuildPath       = cfg.compiler.build_path;
cfg.sourceFilesExtension    = cfg.compiler.source_files.extension;
cfg.objectFilesExtension    = cfg.compiler.object_files.extension;
cfg.objectFilesPath         = cfg.linker.object_files.path;
cfg.runnerName              = cfg.testLib.runnerName;

module.exports = cfg;
