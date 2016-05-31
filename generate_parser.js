var PEG             = require('pegjs');
var clc             = require('cli-color');
var mocha           = require('mocha');
var chai            = require('chai');
var assert          = chai.assert;
var fs              = require('fs');
var dbg             = require('./debug.js');
var pegFilename     = './peg_parser.js';
var startRules      = ['pg_function', 'pg_include', 'pg_rpt', 'pg_rpt_footer'];
var parserOptions   = { allowedStartRules: startRules
                        ,'output': 'source'
                        ,'optimize': 'speed'
                        ,trace: false
                      };

var nl               = '\n',

    src_char         = 'src_char = .'                                                               + nl,
    pg_ws            = ' pg_ws = [ \t]'                                                             + nl,
    pg_col           = 'pg_col = ":"'                                                               + nl,
    pg_nl_seq        = 'pg_nl_seq = "\\n"'                                                          + nl,
    digit            = "digit = [0-9]"                                                              + nl,
    nonzero_digit    = "nonzero_digit    = [1-9]"                                                   + nl,
    octal_digit      = 'octal_digit      = [0-7]'                                                   + nl,
    hex_digit        = "hex_digit        = [0-9a-fA-F]"                                             + nl,
    non_digit        = "non_digit        = [_a-zA-Z]"                                               + nl,
    pg_multi_ln__    = 'pg_multi_ln__ = "/*" (!"*/" src_char)* "*/"'                                + nl,
    pg__             = 'pg__ = pg_multi_ln__'                                                       + nl,
    pg_comment       = 'pg_comment = pg_multi_ln__'                                                 + nl,
    __               = '__ = (pg_ws / pg_nl_seq / pg_comment)*'                                     + nl,
    decimal_constant = 'decimal_constant = nonzero_digit digit*'                                    + nl,
    octal_constant   = 'octal_constant   = "0" octal_digit*'                                        + nl,
    hex_prefix       = 'hex_prefix       = "0x" / "0X"'                                             + nl,
    hex_constant     = "hex_constant = hex_prefix hex_digit+"                                       + nl,
    pg_min_ws        = ' pg_min_ws = pg_ws+'                                                        + nl,
    pg_all_ws        = ' pg_all_ws = pg_ws*'                                                        + nl,
    pg_void          = ' pg_void = "void"'                                                          + nl,
    pg_op_paren      = ' pg_op_paren = "("'                                                         + nl,
    pg_cl_paren      = ' pg_cl_paren = ")"'                                                         + nl,
    pg_int           = ' pg_int = "int"'                                                            + nl,
    pg_char          = ' pg_char = [a-zA-Z0-9_/\\-]'                                                + nl,
    pg_any           = ' pg_any = [a-zA-Z0-9_?!.,\t ]'                                              + nl,
    pg_char_no_col   = ' pg_char_no_col = (pg_char+ / " ")'                                         + nl,
    pg_test_prefix   = ' pg_test_prefix = "test" / "Test"'                                          + nl,
    pg_name          = ' pg_name = pg_test_prefix pg_char+'                                         + nl,
    pg_body          = " pg_body = '{' pg_body '}' / '{' "                                          + nl,
    pg_params0       = '"(" pg_params ")" / "(" pg_all_ws '                                         + nl,
    pg_params1       = ' (pg_void / (pg_int pg_min_ws pg_char+ ) / "")'                             + nl,
    pg_params2       = ' pg_all_ws ")" '                                                            + nl,
    pg_params        = 'pg_params = ' + pg_params0 + pg_params1 + pg_params2 ,
    pg_function0     = ' pg_all_ws pg_void pg_min_ws '                                              + nl,
    pg_function1     = ' pg_name pg_all_ws pg_params pg_all_ws .+ '                                 + nl,
    pg_function      = 'pg_function = ' + pg_function0 + pg_function1                                   ,
    pg_fnchar        = ' pg_fnchar = [a-zA-Z0-9_\.]'                                                + nl,
    pg_sp_mk         = ' pg_sp_mk = \'"\''                                                          + nl,
    pg_op_an_br      = ' pg_op_an_br = "<"'                                                         + nl,
    pg_cl_an_br      = ' pg_cl_an_br = ">"'                                                         + nl,
    pg_includelname  = ' pg_includelname = pg_sp_mk pg_all_ws pg_fnchar+  pg_all_ws pg_sp_mk'       + nl,
    pg_includegname  = ' pg_includegname = pg_op_an_br pg_all_ws pg_fnchar+  pg_all_ws pg_cl_an_br' + nl,
    pg_hinclude      = ' pg_hinclude = "#include"'                                                  + nl,
    pg_linclude      = ' pg_linclude = pg_all_ws pg_hinclude pg_min_ws pg_includelname'             + nl,
    pg_ginclude      = ' pg_ginclude = pg_all_ws pg_hinclude pg_min_ws pg_includegname'             + nl,
    pg_include       = ' pg_include = pg_linclude / pg_ginclude'                                    + nl,
    pg_passfail      = ' pg_passfail = ("PASS" / "FAIL" / "IGNORE") '                               + nl,
    pg_c_ext         = ' pg_c_ext = "." ("c" / "C")'                                                + nl,
    pg_rpt_ln        = ' pg_rpt_ln = nonzero_digit digit* '                                         + nl,
    pg_rpt_name      = ' pg_rpt_name = pg_test_prefix + pg_char+'                                   + nl,
    pg_rpt_ln_msg    = ' pg_rpt_ln_msg = ( !pg_rpt_sht ( src_char / "\\n" ))'                       + nl,
    pg_rpt_lng       = ' pg_rpt_lng = pg_rpt_sht pg_rpt_ln_msg* pg_rpt_sht  '                       + nl,
    pg_rpt           = ' pg_rpt = pg_rpt_lng / pg_exp_was_msg / pg_exp_was / pg_exp / pg_rpt_sht'   + nl,
    pg_rpt_sht       = ' pg_rpt_sht = pg_rpt_name pg_c_ext pg_col pg_rpt_ln pg_col pg_test_prefix pg_char+ pg_col pg_passfail'                       + nl,
    pg_rpt_footer    = ' pg_rpt_footer = digit+ " Tests " digit+ " Failures " digit+ " Ignored" pg_nl_seq'                                           + nl,
    pg_exp_was       = ' pg_exp_was = pg_rpt_sht ": " ( !"Expected " [ \'.0-9a-zA-Z_-] )*  "Expected " [\'.0-9a-zA-Z_-]* " Was " [\'.0-9a-zA-Z_-]* ' + nl,
    pg_exp           = ' pg_exp = pg_rpt_sht ": " [ \t0-9a-zA-Z_.,;:"£$%^&*()?!+={}\\[\\]"-]*'                                                       + nl,
    pg_exp_was_msg   =
      ' pg_exp_was_msg = pg_rpt_sht ": " ( !"Expected " [ \'.0-9a-zA-Z_-] )*  "Expected " [\'.0-9a-zA-Z_-]* " Was " ( !". " [\'.0-9a-zA-Z_-])* ". " src_char*' + nl;


var pg_defs =
      pg_function        +
      pg_include         +
      pg_rpt             +
      pg_rpt_footer      +
      pg_exp_was         +
      pg_exp             +
      src_char           +
      pg_ws              +
      pg_col             +
      pg_nl_seq          +
      digit              +
      nonzero_digit      +
      octal_digit        +
      hex_digit          +
      non_digit          +
      pg_multi_ln__      +
      pg__               +
      pg_comment         +
      __                 +
      decimal_constant   +
      octal_constant     +
      hex_prefix         +
      hex_constant       +
      pg_min_ws          +
      pg_all_ws          +
      pg_void            +
      pg_op_paren        +
      pg_cl_paren        +
      pg_int             +
      pg_char            +
      pg_any             +
      pg_char_no_col     +
      pg_test_prefix     +
      pg_name            +
      pg_body            +
      pg_params          +
      pg_fnchar          +
      pg_sp_mk           +
      pg_op_an_br        +
      pg_cl_an_br        +
      pg_includelname    +
      pg_includegname    +
      pg_hinclude        +
      pg_linclude        +
      pg_ginclude        +
      pg_passfail        +
      pg_c_ext           +
      pg_rpt_ln          +
      pg_rpt_name        +
      pg_rpt_lng         +
      pg_rpt_ln_msg      +
      pg_exp_was_msg     +
      pg_rpt_sht;

var buildPgScript = function() {
  return pg_defs;
}

var buildParser = function(string){
  //  return PEG.buildParser(string,parserOptions);
  return PEG.buildParser(string,{});
};

var parse = function(parser, x){
  try {
    return parser.parse(x);
  }
  catch(err) {
    if (dbg.flags.debug && dbg.flags.showExc)
      console.log(clc.magentaBright(err));
    return false;
  }
};

exports.generateParserSource = function(str, filename){
  fs.writeFileSync(filename, 'module.exports = ' + PEG.buildParser(str, parserOptions), 'utf-8');
};

//fixme this.generateParserSource(buildPgScript(), pegFilename);

describe('test setup', function() {
  it('should assert 1', function(){
    assert.deepEqual(1,1);
  });
  it('should assert false', function(){
    assert.isFalse(false);
  });
  it('should assert true', function(){
    assert.isTrue(true);
  });
  it('should assert undefined', function(){
    assert.isUndefined(true.a);
    assert.isUndefined(false.b);
    assert.isUndefined(undefined);
  });
});

describe('Check single digit parsing: ', function() {
  var p = buildParser(digit);

  it('should return single digit', function () {
    assert.equal('1', parse(p, '1'));
    assert.equal('9', parse(p, '9'));
    assert.equal('0', parse(p, '0'));
  });
  it('should fail for multiple digits', function () {
    assert.isFalse(parse(p, '11'));
    assert.isFalse(parse(p, '00'));
    assert.isFalse(parse(p, '99'));
  });
  it('should fail for single letter', function () {
    assert.isFalse(parse(p, 'a'));
    assert.isFalse(parse(p, 'z'));
  });
});

describe('Check nonzero digit parsing: ', function() {

  var p = buildParser(nonzero_digit);

  it('should return single nonzero digit', function () {
    assert.equal('1', parse(p, '1'));
    assert.equal('9', parse(p, '9'));
  });
  it('should fail for zero, letter or punctuation', function () {
    assert.isFalse(parse(p, '0'));
    assert.isFalse(parse(p, 'a'));
    assert.isFalse(parse(p, 'z'));
    assert.isFalse(parse(p, '.'));
    assert.isFalse(parse(p, ','));
  });
});

describe('Check hex digit parsing: ', function() {

  var p = buildParser(hex_digit);

  it('should return single hex digit', function () {
    assert.equal('0', parse(p, '0'));
    assert.equal('9', parse(p, '9'));
    assert.equal('a', parse(p, 'a'));
    assert.equal('f', parse(p, 'f'));
    assert.equal('A', parse(p, 'A'));
    assert.equal('F', parse(p, 'F'));
  });
  it('should fail for non-hex, letter or punctuation', function () {
    assert.isFalse(parse(p, 'G'));
    assert.isFalse(parse(p, 'g'));
    assert.isFalse(parse(p, 'Z'));
    assert.isFalse(parse(p, 'Z'));
    assert.isFalse(parse(p, ','));
  });
});


describe('Check non digit parsing: ', function() {

  var p = buildParser(non_digit);

  it('should return single non-digit', function () {
    assert.equal('a', parse(p, 'a'));
    assert.equal('z', parse(p, 'z'));
    assert.equal('A', parse(p, 'A'));
    assert.equal('Z', parse(p, 'Z'));
  });
  it('should return single underscore', function () {
    assert.equal('_', parse(p, '_'));
  });
  it('should fail for digit', function () {
    assert.isFalse(parse(p, '0'));
    assert.isFalse(parse(p, '1'));
    assert.isFalse(parse(p, '9'));
  });
  it('should fail for punctuation', function () {
    assert.isFalse(parse(p, '.'));
    assert.isFalse(parse(p, ';'));
    assert.isFalse(parse(p, '('));
  });
});

describe('Check decimal constant parsing: ', function() {

  var p = buildParser(decimal_constant + nl + nonzero_digit + nl + digit);

  it('should return single digit not starting with zero', function () {
    assert.deepEqual(['1', []], parse(p, '1'));
    assert.deepEqual(['9', []], parse(p, '9'));
  });

  it('should return double digit decimal constant', function () {
    assert.deepEqual(['1', ['0']], parse(p, '10'));
    assert.deepEqual(['9', ['9']], parse(p, '99'));
  });
  it('should return multiple digit decimal constant', function () {
    assert.deepEqual(['1', ['0', '9', '8', '7']], parse(p, '10987'));
    assert.deepEqual(['9', ['9','0','0','0']], parse(p, '99000'));
  });

  it('should fail for constant starting with zero', function () {
    assert.isFalse(parse(p, '0'));
    assert.isFalse(parse(p, '00'));
    assert.isFalse(parse(p, '019'));
  });
  it('should fail for constant containing letter', function () {
    assert.isFalse(parse(p, '1a'));
    assert.isFalse(parse(p, '9Z'));
  });
  it('should fail for constant containing point', function () {
    assert.isFalse(parse(p, '.2'));
    assert.isFalse(parse(p, '1.2'));
  });
});

describe('Check octal constant parsing: ', function() {

  var p = buildParser(octal_constant + nl + octal_digit);

  it('should return single zero', function () {
    assert.deepEqual(['0', []], parse(p, '0'));
  });

  it('should return octal double digit', function () {
    assert.deepEqual(['0', ['1']], parse(p, '01'));
    assert.deepEqual(['0', ['7']], parse(p, '07'));
  });

  it('should return octal multi digit', function () {
    assert.deepEqual(['0', ['1','7']], parse(p, '017'));
    assert.deepEqual(['0', ['7','0']], parse(p, '070'));
  });

  it('should fail for constant not starting with zero', function () {
    assert.isFalse(parse(p, '1'));
    assert.isFalse(parse(p, '10'));
    assert.isFalse(parse(p, '717'));
  });

  it('should fail for constant containing letter', function () {
    assert.isFalse(parse(p, '0a'));
    assert.isFalse(parse(p, '01Z'));
  });

});

describe('Hex prefix parsing: ', function() {

  var p = buildParser(hex_prefix);

  it('should parse lower case hex prefix', function () {
    assert.deepEqual('0x', parse(p, '0x'));
  });
  it('should parse upper case hex prefix', function () {
    assert.deepEqual('0X', parse(p, '0X'));
  });
});

describe('Hex constant parsing: ', function() {

  var p = buildParser(hex_constant + nl + hex_prefix + nl + hex_digit);

  it('should parse single digit hex constant', function () {
    assert.deepEqual(['0x', ['0']], parse(p, '0x0'));
    assert.deepEqual(['0X', ['0']], parse(p, '0X0'));
    assert.deepEqual(['0x', ['9']], parse(p, '0x9'));
    assert.deepEqual(['0x', ['a']], parse(p, '0xa'));
    assert.deepEqual(['0x', ['f']], parse(p, '0xf'));
  });
  it('should parse multi digit hex constant', function () {
    assert.deepEqual(['0x', ['0','5','6','7']], parse(p, '0x0567'));
    assert.deepEqual(['0X', ['F','F']], parse(p, '0XFF'));
    assert.deepEqual(['0x', ['9']], parse(p, '0x9'));
    assert.deepEqual(['0x', ['a']], parse(p, '0xa'));
    assert.deepEqual(['0x', ['f']], parse(p, '0xf'));
  });
});

describe('Include Header prefix parsing', function() {

  var p = buildParser(pg_hinclude);

  it('should parse #include', function(){
    assert.deepEqual('#include', parse(p, '#include'));
  });
});

describe('Local header parsing', function() {

  var p = buildParser(' p = pg_sp_mk pg_all_ws pg_fnchar+  pg_all_ws pg_sp_mk' + nl + pg_sp_mk + pg_fnchar + pg_defs);

  it('should parse a name in speech marks', function(){
    assert.deepEqual('abc',parse(p, '"abc"')[2].join(''));
  });

  it('should parse a name in speech marks with proceeding whitespace', function(){
    assert.deepEqual('abc',parse(p, '" abc"')[2].join(''));
  });

  it('should parse a name in speech marks with trailing whitespace', function(){
    assert.deepEqual('abc',parse(p, '" abc  "')[2].join(''));
  });

  it('should parse a filename in speech marks', function(){
    assert.deepEqual('filename.h',parse(p, '" filename.h  "')[2].join(''));
  });
});

describe('Local header  parsing final', function() {

  var p = buildParser(pg_includelname + nl + pg_sp_mk + pg_fnchar + pg_defs);

  it('should parse a name in speech marks', function(){
    assert.deepEqual('abc', parse(p, '"abc"')[2].join(''));
  });

  it('should parse a name in speech marks with proceeding whitespace', function(){
    assert.deepEqual('abc', parse(p, '" abc"')[2].join(''));
  });

  it('should parse a name in speech marks with trailing whitespace', function(){
    assert.deepEqual('abc', parse(p, '" abc  "')[2].join(''));
  });

  it('should parse a filename in speech marks', function(){
    assert.deepEqual('filename.h', parse(p, '" filename.h  "')[2].join(''));
  });
});

describe('Global header parsing', function() {

  var p = buildParser(' p = pg_op_an_br pg_all_ws pg_fnchar+  pg_all_ws pg_cl_an_br' + nl + pg_op_an_br + pg_cl_an_br + pg_fnchar + pg_defs);

  it('should parse a name in angle brackets', function(){
    assert.deepEqual('<', parse(p, '<abc>')[0]);
    assert.deepEqual('abc', parse(p, '<abc>')[2].join(''));
    assert.deepEqual('>', parse(p, '<abc>')[4]);
  });

  it('should parse a name in angle brackets with proceeding whitespace', function(){
    assert.deepEqual('<', parse(p,   '< abc>')[0]);
    assert.deepEqual('abc', parse(p, '< abc>')[2].join(''));
    assert.deepEqual('>', parse(p,   '< abc>')[4]);
  });

  it('should parse a name in angle brackets with trailing whitespace', function(){
    assert.deepEqual('<', parse(p,   '< abc  >')[0]);
    assert.deepEqual('abc', parse(p, '< abc  >')[2].join(''));
    assert.deepEqual('>', parse(p,   '< abc  >')[4]);
  });

  it('should parse a filename in angle brackets', function(){
    assert.deepEqual('<', parse(p,   '< filename.h  >')[0]);
    assert.deepEqual('filename.h', parse(p, '< filename.h  >')[2].join(''));
    assert.deepEqual('>', parse(p,   '< filename.h  >')[4]);
  });
});

describe('Global header parsing final', function() {

  var p = buildParser(pg_includegname + nl + pg_op_an_br + pg_cl_an_br + pg_fnchar + pg_defs);

  it('should parse a name in angle brackets', function(){
    assert.deepEqual('<',   parse(p, '<abc>')[0]);
    assert.deepEqual('abc', parse(p, '<abc>')[2].join(''));
    assert.deepEqual('>',   parse(p, '<abc>')[4]);
  });

  it('should parse a name in angle brackets', function(){
    assert.deepEqual('<',   parse(p, '< abc>')[0]);
    assert.deepEqual('abc', parse(p, '< abc>')[2].join(''));
    assert.deepEqual('>',   parse(p, '< abc>')[4]);
  });

  it('should parse a name in angle brackets', function(){
    assert.deepEqual('<',   parse(p, '< abc>')[0]);
    assert.deepEqual('abc', parse(p, '< abc>')[2].join(''));
    assert.deepEqual('>',   parse(p, '< abc>')[4]);
  });

  it('should parse a name in angle brackets', function(){
    assert.deepEqual('<',   parse(p, '< abc  >')[0]);
    assert.deepEqual('abc', parse(p, '< abc  >')[2].join(''));
    assert.deepEqual('>',   parse(p, '< abc  >')[4]);
  });

  it('should parse a name in angle brackets', function(){
    assert.deepEqual('<',   parse(p, '< filename.h  >')[0]);
    assert.deepEqual('filename.h', parse(p, '< filename.h  >')[2].join(''));
    assert.deepEqual('>',   parse(p, '< filename.h  >')[4]);
  });
});

describe('Parsing global and local includes', function() {
  var p = buildParser('pg_includename = pg_includelname / pg_includegname' + nl +
                      pg_includelname + pg_includegname +
                      pg_fnchar + pg_defs + pg_op_an_br + pg_cl_an_br + pg_sp_mk);

  it('should parse a local filename', function(){
    assert.deepEqual(['"',[],['a','b','c','.','h'],[],'"'],parse(p, '"abc.h"'));
  });

  it('should parse a local filename with preceding whitespace', function(){
    assert.deepEqual(['"',[' '],['a','b','c','.','h'],[],'"'],parse(p, '" abc.h"'));
  });

  it('should parse a local filename with trailing whitespace', function(){
    assert.deepEqual(['"',[],['a','b','c','.','h'],[' '],'"'],parse(p, '"abc.h "'));
  });

  it('should parse a global filename', function(){
    assert.deepEqual(['<',[],['a','b','c','.','h'],[],'>'],parse(p, '<abc.h>'));
  });

  it('should parse a global filename with preceding whitespace', function(){
    assert.deepEqual(['<',[' '],['a','b','c','.','h'],[],'>'],parse(p, '< abc.h>'));
  });

  it('should parse a global filename with trailing whitespace', function(){
    assert.deepEqual(['<',[],['a','b','c','.','h'],[' '],'>'],parse(p, '<abc.h >'));
  });
});

describe('Parsing global and local includes final', function() {
  var p = buildParser('a = pg_include ' + nl + pg_defs);

  it('should parse a local filename', function(){
    assert.deepEqual('#include', parse(p, '#include "abc.h"')[1]);
    assert.deepEqual('abc.h'   , parse(p, '#include "abc.h"')[3][2].join(''));
    assert.deepEqual('"'       , parse(p, '#include "abc.h"')[3][0]);
    assert.deepEqual('"'       , parse(p, '#include "abc.h"')[3][4]);
  });
});

describe('Parse Test Results String', function() {

  it('should parse a test filename with lower case extension', function(){
    var p = buildParser('pg_rpt_name = pg_name + pg_c_ext' + nl + pg_test_prefix + pg_name + pg_char + pg_c_ext);
    var parsed = parse(p, 'testunity_Runner.c');

    assert.deepEqual('test',  parse(p, 'testunity_Runner.c')[0][0][0]);
    assert.deepEqual('unity_Runner', parse(p, 'testunity_Runner.c')[0][0][1].join(''));
    assert.deepEqual('.c', parse(p, 'testunity_Runner.c')[1].join(''));
    assert.deepEqual('_z', parse(p, 'test_z.c')[0][0][1].join(''));
    assert.deepEqual('_8', parse(p, 'test_8.c')[0][0][1].join(''));
  });

  it('should parse a test filename with upper case extension', function(){
    var p = buildParser('pg_rpt_name = pg_name + pg_c_ext' + nl + pg_test_prefix + pg_name + pg_char + pg_c_ext);
    assert.deepEqual('.C', parse(p, 'testunity_Runner.C')[1].join(''));
  });

  it('should parse a test filename with forward slash', function(){
    var p = buildParser('pg_rpt_name = pg_name + pg_c_ext' + nl + pg_test_prefix + pg_name + pg_char + pg_c_ext);
    assert.deepEqual('.C', parse(p, 'testunity_Runner.C')[1].join(''));
  });

  it('should parse a test a single digit line number', function(){
    var p = buildParser('pg_report_ln = ":" nonzero_digit digit* ":"' + nl + nonzero_digit + digit);
    assert.deepEqual([':','1',[],':'], parse(p, ':1:'));
  });

  it('should parse a test with multi digit line number', function(){
    var p = buildParser('pg_report_ln = pg_col nonzero_digit digit* pg_col' + nl + pg_col + nonzero_digit + digit);
    assert.deepEqual([':','1',['2','3','0'],':'], parse(p, ':1230:'));
  });

  it('should parse a test name with single char prefix', function() {
    var p = buildParser('pg_rpt_name = pg_test_prefix + pg_char+' + nl + digit + pg_char + pg_test_prefix);
    assert.deepEqual([['Test'],['1']], parse(p, 'Test1'));
    assert.deepEqual([['test'],['0']], parse(p, 'test0'));
    assert.deepEqual([['Test'],['a']], parse(p, 'Testa'));
    assert.deepEqual([['test'],['z']], parse(p, 'testz'));
  });

  it('should parse a test name with multi char prefix', function() {
    var p = buildParser('pg_rpt_name = pg_test_prefix + pg_char+' + nl + digit + pg_char + pg_test_prefix);
    assert.deepEqual([['Test'],['1','2']], parse(p, 'Test12'));
    assert.deepEqual([['test'],['_','0']], parse(p, 'test_0'));
    assert.deepEqual([['Test'],['a','z']], parse(p, 'Testaz'));
    assert.deepEqual([['test'],['_','z','A']], parse(p, 'test_zA'));
  });

  it('should parse PASS', function(){
    var p = buildParser(pg_passfail);
    assert.deepEqual('PASS', parse(p, 'PASS'));
  });

  it('should parse FAIL', function(){
    var p = buildParser(pg_passfail);
    assert.deepEqual('FAIL', parse(p, 'FAIL'));
  });

  it('should parse short report line', function(){
    var p = buildParser(
      'a = pg_rpt ' + nl + pg_defs);

    parsed = parse(p, 'testunity_Runner.c:94:Test_True:PASS');
    assert.deepEqual('test', parsed[0][0][0]);
    assert.deepEqual('unity_Runner', parsed[0][1].join(''));
    assert.deepEqual('.c', parsed[1].join(''));
    assert.deepEqual('94', parsed[3].join(''));
    assert.deepEqual('94', parsed[3].join(''));
    assert.deepEqual('Test', parsed[5]);
    assert.deepEqual('_True', parsed[6].join(''));
    assert.deepEqual('PASS', parsed[8]);
  });
});

describe('Should Parse Comments', function() {

  it('should do multiline comment with lookahead', function(){
    var p = buildParser('c_comment = "/*"  ( !"*/"  (. / "\\n") )* "*/" ');
    assert.equal("/*, ,,s,, */", parse(p, '/* s */').join(''));
  });

  it('should do multiline comment with pg vars', function(){
    var p = buildParser('c = __ "a b c" __' + nl + __ + pg_ws +
                        pg_nl_seq + pg_comment + pg_multi_ln__ + src_char);
    assert.deepEqual([[],"a b c",[]], parse(p, 'a b c'));
  });
});

describe('Parse Test Results Known Fail String', function() {

  it('should parse first part of message', function(){
    var p = buildParser('pg_rpt_msg = pg_any+ pg_col pg_passfail' + nl + pg_any + pg_col + pg_passfail);
    assert.deepEqual('ab', parse(p, 'ab:PASS')[0].join(''));
  });

  it('should lookahead', function(){
    var p = buildParser('some_body = obr ( !cbr (all / nl) )* cbr   \n\
                        obr = "("                                   \n\
                        cbr = ")"                                   \n\
                        all = .                                     \n\
                        nl  = "\\n"                                 \n\
                        ', {trace: true});
    assert.isArray(parse(p, '(fjsdkalfsaj;encldd;skl\'e[]\')'));
  });

  it('should lookahead  2', function(){
    var p = buildParser('a = pg_rpt_lng' + nl + pg_defs);
//        + pg_rpt_sht + pg_rpt_name + pg_c_ext + pg_col + pg_rpt_ln+
//        pg_test_prefix + pg_char + pg_passfail + nonzero_digit +
//        digit + src_char + nl
//      , {trace: true});
    assert.isArray(parse(p, 'testa.c:1:Testb:FAIL: atesta.c:2:Testb:FAIL'));
    assert.isArray(
      parse(p,'testunity_Runner.c:3483:testNotEqualDoubleArraysInf:FAIL: Element 1 Values Not Within Delta testunity_Runner.c:3474:testNotEqualDoubleArraysInf:PASS'));
  });
});


describe('Parse Rpt Footer', function(){
  var p = buildParser('a = pg_rpt_footer ' + nl + pg_rpt_footer + digit + pg_nl_seq);
  it('should parse report footer', function(){
    var parsed = parse(p, '319 Tests 0 Failures 1 Ignored\n');
    assert.isArray(parsed);
    assert.deepEqual('319', parsed[0].join(''));
    assert.deepEqual('0',   parsed[2].join(''));
    assert.deepEqual('1',   parsed[4].join(''));
  });
});

describe('Parse Test Fails as Expected:', function() {
  var p = buildParser(
    'a =  pg_rpt_lng / pg_rpt_sht ' + nl
      + pg_defs, {trace: true});

  it('should pass since test failed as expected', function(){
    var scr =
          'test_z_Runner.c:1175:Test_INT32sNotWithinDelta:FAIL: Values Not Within Delta 1 Expected -3 Was 1test_z_Runner.c:1172:Test_INT32sNotWithinDelta:FAIL';
    var parsed = parse(p, scr);
    assert.isArray(parsed);
    assert.deepEqual('test' , parsed[0][0][0][0]);
  });
});

describe('Parse Expected - Was (breakdown):', function() {
  var p = buildParser(
    'a =  ": Expected " [0-9a-zA-Z_-]* " Was " [0-9a-zA-Z_]*' + nl + pg_defs);
  var scr = ': Expected -1 Was 20';
  var parsed = parse(p, scr);
  it('should extract Expected', function(){
    assert.deepEqual(': Expected ', parsed[0]);
  });

  it('should extract Was', function(){
    assert.deepEqual(' Was ', parsed[2]);
  });

  it('should extract Expected value', function(){
    assert.deepEqual('-1', parsed[1].join(''));
  });

  it('should extract Was value', function(){
    assert.deepEqual('20', parsed[3].join(''));
  });
});

describe('Parse Expected FALSE Was TRUE final:', function() {
  var p = buildParser('a = pg_exp_was ' + nl + pg_defs);
  var scr = 'test_0_Runner.c:31:test_TEST_ASSERT_FALSE:FAIL: Expected FALSE Was TRUE';
  it('should extract test', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('test', parsed[0][0][0][0]);
  });

  it('should extract Expected', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('Expected ', parsed[3]);
  });

  it('should extract FALSE', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('FALSE', parsed[4].join(''));
  });

  it('should extract Was', function(){
    var parsed = parse(p, scr);
    assert.deepEqual(' Was ', parsed[5]);
  });

  it('should extract TRUE', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('TRUE', parsed[6].join(''));
  });
});

describe('Parse Expected TRUE Was FALSE final:', function() {
  var p = buildParser('a = pg_exp_was ' + nl + pg_defs);
  var scr = 'test_0_Runner.c:31:test_TEST_ASSERT_FALSE:FAIL: Expected TRUE Was FALSE';
  var parsed = parse(p, scr);

  it('should extract TRUE', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('TRUE', parsed[4].join(''));
  });

  it('should extract FALSE', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('FALSE', parsed[6].join(''));
  });
});

describe('Parse Expected Was Integers final:', function() {
  var p = buildParser('a = pg_exp_was ' + nl + pg_defs);
  var scr = 'test_0_Runner.c:46:test_TEST_ASSERT_EQUAL_INT:FAIL: Expected 123 Was 124';
  var parsed = parse(p, scr);

  it('should extract 123', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('123', parsed[4].join(''));
  });

  it('should extract 124', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('124', parsed[6].join(''));
  });
});

describe('Parse Expected Was negative Integers final:', function() {
  var p = buildParser('a = pg_exp_was ' + nl + pg_defs);
  var scr = 'test_0_Runner.c:50:test_TEST_ASSERT_EQUAL_INT8__0:FAIL: Expected -1 Was -2';
  var parsed = parse(p, scr);

  it('should extract -1', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('-1', parsed[4].join(''));
  });

  it('should extract -2', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('-2', parsed[6].join(''));
  });
});

describe('Parse Expected Was hex numbers final:', function() {
  var p = buildParser('a = pg_exp_was ' + nl + pg_defs);
  var scr = 'test_0_Runner.c:118:test_ASSERT_EQUAL_HEX64:FAIL: Expected 0x000000000000FFFE Was 0x000000000000FFFF';
  var parsed = parse(p, scr);

  it('should extract 0x000000000000FFFE', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('0x000000000000FFFE', parsed[4].join(''));
  });

  it('should extract 0x000000000000FFFF', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('0x000000000000FFFF', parsed[6].join(''));
  });
});

describe('Parse Expected FALSE Was TRUE as report parse:', function() {
  var p = buildParser('a = pg_rpt ' + nl + pg_defs);
  var scr = 'test_0_Runner.c:31:test_TEST_ASSERT_FALSE:FAIL: Expected FALSE Was TRUE';
  it('should extract test', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('test', parsed[0][0][0][0]);
  });

  it('should extract Expected', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('Expected ', parsed[3]);
  });

  it('should extract FALSE', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('FALSE', parsed[4].join(''));
  });

  it('should extract Was', function(){
    var parsed = parse(p, scr);
    assert.deepEqual(' Was ', parsed[5]);
  });

  it('should extract TRUE', function(){
    var parsed = parse(p, scr);
    assert.deepEqual('TRUE', parsed[6].join(''));
  });
});

describe('Parse Assert Unless:', function() {
  var p = buildParser('a = pg_exp' + nl + pg_defs);
  var scr = 'test_0_Runner.c:28:test_TEST_ASSERT_UNLESS:FAIL: Expression Evaluated To TRUE';
  var parsed = parse(p, scr);

  it('should extract test', function(){
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
  });

  it('should extract FAIL', function(){
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
    assert.deepEqual('FAIL', parsed[0][8]);
  });

  it('should extract message', function(){
    assert.isArray(parsed);
    assert.deepEqual('Expression Evaluated To TRUE', parsed[2].join(''));
  });
});


describe('Parse Assert Unless final:', function() {
  var p = buildParser('a = pg_rpt' + nl + pg_defs);
  var scr = 'test_0_Runner.c:28:test_TEST_ASSERT_UNLESS:FAIL: Expression Evaluated To TRUE';

  var parsed = parse(p, scr);
  it('should extract test', function(){
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
  });

  it('should extract FAIL', function(){
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
    assert.deepEqual('FAIL', parsed[0][8]);
  });

  it('should extract message', function(){
    assert.isArray(parsed);
    assert.deepEqual('Expression Evaluated To TRUE', parsed[2].join(''));
  });
});

describe('filename in speech marks parsing', function() {

  var p = buildParser('sm = pg_includelname  ' + nl + pg_defs);

  it('should parse a local include filename', function(){
    assert.deepEqual('abc', parse(p, '"abc"')[2].join(''));
  });

  it('should parse a local include filename with proceeding whitespace', function(){
    assert.deepEqual('abc', parse(p, '"  abc"')[2].join(''));
  });
});

describe('Include Header Local File Parsing:', function() {

  var p = buildParser('a = pg_linclude ' + nl + pg_defs);

  it('should parse local header', function() {
    assert.deepEqual('#include', parse(p, '#include "name"')[1]);
    assert.deepEqual('"', parse(p, '#include "name"')[3][0]);
    assert.deepEqual('name', parse(p, '#include "name"')[3][2].join(''));
    assert.deepEqual('name', parse(p, '  #include "name"')[3][2].join(''));
    assert.deepEqual('name', parse(p, '  #include " name"')[3][2].join(''));
    assert.deepEqual('name', parse(p, '  #include "  name  "')[3][2].join(''));
    assert.deepEqual('"', parse(p, '#include "name"')[3][4]);
  });
});

describe('Include Header Global File Parsing:', function() {

  var p = buildParser('a = pg_ginclude ' + nl + pg_defs);

  it('should parse global header', function() {
    assert.deepEqual('#include', parse(p, '#include <name>')[1]);
    assert.deepEqual('#include', parse(p, '#include < name>')[1]);
    assert.deepEqual('#include', parse(p, '#include  < name >')[1]);
    assert.deepEqual('<', parse(p, '#include <name>')[3][0]);
    assert.deepEqual('>', parse(p, '#include <name>')[3][4]);
  });
});

describe('Include Combined Global and Local Include File Parsing:', function() {
  var p = buildParser('a= pg_include ' + nl + pg_defs);

  it('should parse local header', function() {
    assert.deepEqual('#include', parse(p, '#include "name"')[1]);
    assert.deepEqual('"', parse(p, '#include "name"')[3][0]);
    assert.deepEqual('name', parse(p, '#include "name"')[3][2].join(''));
    assert.deepEqual('name', parse(p, '  #include "name"')[3][2].join(''));
    assert.deepEqual('name', parse(p, '  #include " name"')[3][2].join(''));
    assert.deepEqual('name', parse(p, '  #include "  name  "')[3][2].join(''));
    assert.deepEqual('"', parse(p, '#include "name"')[3][4]);
  });

  it('should parse global header', function() {
    assert.deepEqual('#include', parse(p, '#include <name>')[1]);
    assert.deepEqual('#include', parse(p, '#include < name>')[1]);
    assert.deepEqual('#include', parse(p, '#include  < name >')[1]);
    assert.deepEqual('<', parse(p, '#include <name>')[3][0]);
    assert.deepEqual('>', parse(p, '#include <name>')[3][4]);
  });
});

describe('Report Parsing all pass and fail cases', function(){
  var p = buildParser(' a = pg_rpt_lng / pg_exp_was / pg_exp / pg_rpt_sht' + nl + pg_defs);

  it('should parse expression evaluated fail ', function() {
    var parsed = parse(p, 'test_0_Runner.c:15:test_TEST_ASSERT:FAIL: Expression Evaluated To FALSE');
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
    assert.deepEqual('_0_Runner', parsed[0][0][1].join(''));
    assert.deepEqual('.c', parsed[0][1].join(''));
    assert.deepEqual('15', parsed[0][3].join(''));
    assert.deepEqual('test', parsed[0][5]);
    assert.deepEqual('_TEST_ASSERT', parsed[0][6].join(''));
    assert.deepEqual('FAIL', parsed[0][8]);
    assert.deepEqual(': ', parsed[1]); //:exp
    assert.deepEqual('Expression Evaluated To FALSE', parsed[2].join('')); // expected in exp/was failure
    assert.deepEqual(': ', parsed[1]);         //second :exp
    assert.isUndefined(parsed[3]);             //was
    assert.isUndefined(parsed[4]);
  });

  it('should pass long self test format fail to pass', function(){
    var parsed = parse(p, 'test_g.c:3483:testNotEqualDoubleArraysInf:FAIL: Element 1 Values Not Within Delta test_g.c:3474:testNotEqualDoubleArraysInf:PASS');
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
    assert.deepEqual('_g', parsed[0][0][1].join(''));
    assert.deepEqual('.c', parsed[0][1].join(''));
    assert.deepEqual('3483', parsed[0][3][0] + parsed[0][3][1].join(''));
    assert.deepEqual('test', parsed[0][5]);
    assert.deepEqual('NotEqualDoubleArraysInf', parsed[0][6].join(''));
    assert.deepEqual('FAIL', parsed[0][8]);
    assert.deepEqual(':', parsed[1][0][1]); // ': Expected differs
    assert.deepEqual('test', parsed[2][0][0][0]);
    assert.deepEqual('_g',   parsed[2][0][1].join(''));
    assert.deepEqual('.c',   parsed[2][1].join(''));
    assert.deepEqual('3474', parsed[2][3][0] + parsed[2][3][1].join(''));
    assert.deepEqual('test', parsed[2][5]);
    assert.deepEqual('NotEqualDoubleArraysInf', parsed[2][6].join(''));
    assert.deepEqual('PASS', parsed[2][8]);
  });

  it('should pass short format pass', function(){
    parsed = parse(p, 'testunity.c:94:testTrue:PASS');
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0]);
    assert.deepEqual('unity', parsed[0][1].join(''));
    assert.deepEqual('.c', parsed[1].join(''));
    assert.deepEqual('94', parsed[3][0] + parsed[3][1].join(''));
    assert.deepEqual('test', parsed[5]);
    assert.deepEqual('True', parsed[6].join(''));
    assert.deepEqual('PASS', parsed[8]);
  });

  it('should parse a test ignore', function(){
    parsed = parse(p, 'test_a_Runner.c:2142:Test_IgnoredAndThenFailInTearDown:IGNORE');
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0]);
    assert.deepEqual('_a_Runner', parsed[0][1].join(''));
    assert.deepEqual('.c', parsed[1].join(''));
    assert.deepEqual('2142', parsed[3][0] + parsed[3][1].join(''));
    assert.deepEqual('Test', parsed[5]);
    assert.deepEqual('_IgnoredAndThenFailInTearDown', parsed[6].join(''));
    assert.deepEqual('IGNORE', parsed[8]);
  });

  it('should parse expected was style fail', function(){
    var parsed = parse(p, 'test_0_Runner.c:90:test_TEST_ASSERT_EQUAL_UINT:FAIL: Expected 0 Was 254');
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
    assert.deepEqual('_0_Runner', parsed[0][0][1].join(''));
    assert.deepEqual('.c', parsed[0][1].join(''));
    assert.deepEqual('90', parsed[0][3][0] + parsed[0][3][1].join(''));
    assert.deepEqual('test', parsed[0][5]);
    assert.deepEqual('_TEST_ASSERT_EQUAL_UINT', parsed[0][6].join(''));
    assert.deepEqual('FAIL', parsed[0][8]);
    assert.deepEqual('Expected ', parsed[3]); //:exp
    assert.deepEqual('0', parsed[4].join(''));
    assert.deepEqual(' Was ', parsed[5]);       //was
    assert.deepEqual('254', parsed[6].join(''));
  });

});

describe('ASSERT_INT_WITHIN parsing', function() {
  var pa = buildParser(' a = pg_exp_was '
                       + nl + pg_rpt_sht + pg_rpt_name + pg_c_ext + pg_col + pg_rpt_ln
                       + pg_test_prefix + pg_char + pg_passfail + nonzero_digit
                       + digit + src_char + nl
                       + ' pg_exp_was = pg_rpt_sht ": " ( !"Expected " [ \'.0-9a-zA-Z_-] )*  "Expected " [\'.0-9a-zA-Z_-]* " Was " [\'.0-9a-zA-Z_-]* '
                       + nl);

//  it('should parse ASSERT_INT_WITHIN test', function(){
//    parsed = parse(pa, 'test_0_Runner.c:139:test_TEST_ASSERT_INT_WITHIN:FAIL: Values Not Within Delta 20 Expected 100 Was 150');
//    assert.isArray(parsed);
//    assert.isArray(parsed);
//    assert.deepEqual('test', parsed[0][0][0][0]);
//    assert.deepEqual('_0_Runner', parsed[0][0][1].join(''));
//    assert.deepEqual('.c', parsed[0][1].join(''));
//    assert.deepEqual('139', parsed[0][3][0] + parsed[0][3][1].join(''));
//    assert.deepEqual('test', parsed[0][5]);
//    assert.deepEqual('_TEST_ASSERT_INT_WITHIN', parsed[0][6].join(''));
//    assert.deepEqual('FAIL', parsed[0][8]);
//    assert.deepEqual(':', parsed[1][0]); // ': Expected differs
//    var x = parsed[2][0][1]
//          + parsed[2][1][1]
//          + parsed[2][2][1]
//          + parsed[2][3][1]
//          + parsed[2][4][1]
//          + parsed[2][5][1];
//    x = x.replace(/,/g , '');
//    assert.deepEqual('Values Not Within Delta 20', x );
//    assert.deepEqual('Expected ', parsed[3]);
//    assert.deepEqual('100', parsed[4].join(''));
//    assert.deepEqual(' Was ', parsed[5]);
//    assert.deepEqual('150', parsed[6].join(''));
//  });

  it('should parse TEST_ASSERT_EQUAL_STRING result', function(){
    parsed = parse(pa, "test_0_Runner.c:163:test_TEST_ASSERT_EQUAL_STRING:FAIL: Expected 'here' Was 'there'");
    assert.deepEqual('Expected ', parsed[3]);
    assert.deepEqual("'here'", parsed[4].join(''));
    assert.deepEqual(' Was ', parsed[5]);
    assert.deepEqual("'there'", parsed[6].join(''));
  });
});

describe('Fix regression error', function(){
  //  var p = buildParser(' a = pg_rpt_lng / pg_exp_was / pg_exp / pg_rpt_sht' + nl + pg_defs);
  var p = buildParser('a = pg_rpt' + nl + pg_defs);
  var scr = 'test_z_Runner.c:96:Test_True:FAIL: Expression Evaluated To FALSE[[[[ Previous Test Should Have Passed But Did Not ]]]]';

  it('should FAIL with long error message', function() {
    var parsed = parse(p, scr);
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
    assert.deepEqual('_z_Runner', parsed[0][0][1].join(''));
    assert.deepEqual('.c', parsed[0][1].join(''));
    assert.deepEqual('96', parsed[0][3][0] + parsed[0][3][1].join(''));
    assert.deepEqual('Test', parsed[0][5]);
    assert.deepEqual('_True', parsed[0][6].join(''));
    assert.deepEqual('FAIL', parsed[0][8]);
    assert.deepEqual('Expression Evaluated To FALSE[[[[ Previous Test Should Have Passed But Did Not ]]]]', parsed[2].join(''));
    assert.isUndefined(parsed[3]); //:exp
    assert.isUndefined(parsed[4]);
    assert.isUndefined(parsed[5]);       //was
  });
});

describe('Parse added error message including whitespace', function(){
  //  var p = buildParser(' a = pg_rpt_lng / pg_exp_was / pg_exp / pg_rpt_sht' + nl + pg_defs);
  var p = buildParser('a = pg_rpt' + nl + pg_defs);

  it('should parse added message', function() {
    var scr = 'test_0_Runner.c:225:test_TEST_ASSERT_MESSAGE:FAIL: Message';
    assert.isArray(parse(p, scr));
    assert.deepEqual('Message', parse(p, scr)[2].join(''));
  });
  it('should parse added message including whitespace', function() {
    var scr = 'test_0_Runner.c:225:test_TEST_ASSERT_MESSAGE:FAIL: I am the Error Message';
    assert.isArray(parse(p, scr));
    assert.deepEqual('I am the Error Message', parse(p, scr)[2].join(''));
  });
});

describe('Parse added error message with punctuation', function(){
  var p = buildParser('a = pg_rpt' + nl + pg_defs);
  it('should parse period', function() {
    assert.isArray(parse(p, 'test_0_Runner.c:225:test_TEST_ASSERT_MESSAGE:FAIL: A message.'));
  });
  it('should parse comma', function() {
    assert.isArray(parse(p, 'test_0_Runner.c:225:test_TEST_ASSERT_MESSAGE:FAIL: A message,'));
  });
  it('should parse plus minus equal', function() {
    assert.isArray(parse(p, 'test_0_Runner.c:225:test_TEST_ASSERT_MESSAGE:FAIL: A message,.-=+ '));
  });

  it('should parse !', function() {
    assert.isArray(parse(p, 'test_0_Runner.c:225:test_TEST_ASSERT_MESSAGE:FAIL: A message!'));
    assert.isArray(parse(p, 'test_0_Runner.c:225:test_TEST_ASSERT_MESSAGE:FAIL: !! some message !!'));
  });

  it('should parse ?', function() {
    assert.isArray(parse(p, 'test_0_Runner.c:225:test_TEST_ASSERT_MESSAGE:FAIL: A message?'));
    assert.isArray(parse(p, 'test_0_Runner.c:225:test_TEST_ASSERT_MESSAGE:FAIL: ?? some message ??'));
  });
});

describe('Parse assert equal type with added message', function(){
  var p = buildParser('a = pg_rpt_sht ": " ( !"Expected " [ \'.0-9a-zA-Z_-] )*  "Expected " [\'.0-9a-zA-Z_-]* " Was " ( !". " [\'.0-9a-zA-Z_-])* ". " src_char*' + nl + pg_defs);
  var scr = 'test_0_Runner.c:245:test_TEST_ASSERT_EQUAL_INT_MESSAGE:FAIL: Expected 123 Was 12. an error message';
  var parsed = parse(p, scr);
  it('should parse equal int with added message', function() {
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
    assert.deepEqual('_0_Runner', parsed[0][0][1].join(''));
    assert.deepEqual('.c', parsed[0][1].join(''));
    assert.deepEqual('245', parsed[0][3][0] + parsed[0][3][1].join(''));
    assert.deepEqual('test', parsed[0][5]);
    assert.deepEqual('_TEST_ASSERT_EQUAL_INT_MESSAGE', parsed[0][6].join(''));
    assert.deepEqual('FAIL', parsed[0][8]);
    assert.deepEqual('Expected ', parsed[3]); //:exp
    assert.deepEqual('123', parsed[4].join(''));
    assert.deepEqual(' Was ', parsed[5]);       //was
    assert.deepEqual('12', parsed[6].join('').replace(/,/g, ''));
    assert.deepEqual('. ', parsed[7]);
    assert.deepEqual('an error message', parsed[8].join(''));
  });
});

describe('Parse assert equal type with added message and period in actual val', function(){
  var p = buildParser('a = pg_rpt_sht ": " ( !"Expected " [ \'.0-9a-zA-Z_-] )*  "Expected " [\'.0-9a-zA-Z_-]* " Was " ( !". " [\'.0-9a-zA-Z_-])* ". " src_char*' + nl + pg_defs);
  var scr = 'test_0_Runner.c:245:test_TEST_ASSERT_EQUAL_INT_MESSAGE:FAIL: Expected 123 Was 1.2. an error message';
  var parsed = parse(p, scr);
  it('should parse equal int with added message', function() {
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
    assert.deepEqual('_0_Runner', parsed[0][0][1].join(''));
    assert.deepEqual('.c', parsed[0][1].join(''));
    assert.deepEqual('245', parsed[0][3][0] + parsed[0][3][1].join(''));
    assert.deepEqual('test', parsed[0][5]);
    assert.deepEqual('_TEST_ASSERT_EQUAL_INT_MESSAGE', parsed[0][6].join(''));
    assert.deepEqual('FAIL', parsed[0][8]);
    assert.deepEqual('Expected ', parsed[3]); //:exp
    assert.deepEqual('123', parsed[4].join(''));
    assert.deepEqual(' Was ', parsed[5]);       //was
    assert.deepEqual('1.2', parsed[6].join('').replace(/,/g, ''));
    assert.deepEqual('. ', parsed[7]);
    assert.deepEqual('an error message', parsed[8].join(''));
  });
});
describe('Parse INT_64_WITHIN_MESSAGE for default message', function(){
  var p = buildParser('a = pg_rpt' + nl + pg_defs);
  var scr = 'test_0_Runner.c:439:test_TEST_ASSERT_INT64_WITHIN_MESSAGE:FAIL: Values Not Within Delta 20 Expected 100 Was 150. within message INT64';
  var parsed = parse(p, scr);
  it('should parse equal int with added message', function() {
    assert.isArray(parsed);
    assert.deepEqual('test', parsed[0][0][0][0]);
    assert.deepEqual('_0_Runner', parsed[0][0][1].join(''));
    assert.deepEqual('.c', parsed[0][1].join(''));
    assert.deepEqual('439', parsed[0][3][0] + parsed[0][3][1].join(''));
    assert.deepEqual('test', parsed[0][5]);
    assert.deepEqual('_TEST_ASSERT_INT64_WITHIN_MESSAGE', parsed[0][6].join(''));
    assert.deepEqual('FAIL', parsed[0][8]);
    assert.deepEqual('Values Not Within Delta 20 ', parsed[2].join('').replace(/,/g, ''));
    assert.deepEqual('Expected ', parsed[3]); //:exp
    assert.deepEqual('100', parsed[4].join(''));
    assert.deepEqual(' Was ', parsed[5]);       //was
    assert.deepEqual('150', parsed[6].join('').replace(/,/g, ''));
    assert.deepEqual('. ', parsed[7]);
    assert.deepEqual('within message INT64', parsed[8].join(''));
  });
});
