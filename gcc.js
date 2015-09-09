var cfg = {};
cfg.compiler = {}
cfg.compiler.path = 'gcc';
cfg.compiler.unit_tests_path = '/Users/martyn/_unity_quick_setup/dev/Unity/test/tests/';
cfg.compiler.build_path = '/Users/martyn/_unity_quick_setup/dev/Unity/test/build/';
cfg.compiler.options = ['-c', '-m64', '-Wall', '-Wno-address', '-std=c99',
                         '-pedantic', '-Wextra', '-Werror', '-Wpointer-arith',
                         '-Wcast-align', '-Wwrite-strings', '-Wswitch-default',
                         '-Wunreachable-code', '-Winit-self',
                         '-Wmissing-field-initializers',
                         '-Wno-unknown-pragmas', '-Wstrict-prototypes',
                         '-Wundef', '-Wold-style-definition'];

cfg.compiler.includes = {};
cfg.compiler.includes.prefix = '-I';
cfg.compiler.includes.items = ['/Users/martyn/_unity_quick_setup/dev/Unity/src/', cfg.compiler.unit_tests_path];
cfg.compiler.defines = {};
cfg.compiler.defines.prefix = '-D';
cfg.compiler.defines.items = ['UNITY_INCLUDE_DOUBLE', 'UNITY_SUPPORT_TEST_CASES',
                              'UNITY_SUPPORT_64'];
cfg.compiler.object_files = {};
cfg.compiler.object_files.prefix = '-o';
cfg.compiler.object_files.extension = '.o';
cfg.compiler.object_files.destination = cfg.compiler.build_path;

cfg.linker = {};
cfg.linker.path = 'gcc';
cfg.linker.options = ['-lm','-m64'];

cfg.linker.includes = {};
cfg.linker.includes.prefix = '-I';

cfg.linker.object_files = {};
cfg.linker.object_files.path = cfg.compiler.build_path;
cfg.linker.object_files.extension = '.o';
cfg.linker.bin_files = {};
cfg.linker.bin_files.prefix = '-o';
cfg.linker.bin_files.extension = '.exe';
cfg.linker.bin_files.destination = cfg.compiler.build_path;

cfg.color = true;

cfg.unity = {};
cfg.name = 'unity.c';
cfg.unity.source = {};
cfg.unity.source_path = '/Users/martyn/_unity_quick_setup/dev/Unity/src/';
cfg.unity.plugins = [];

exports.data = function() {
  return cfg;
};
