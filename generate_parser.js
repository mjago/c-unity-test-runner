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
    pg_char          = ' pg_char = [a-zA-Z0-9_]'                                                    + nl,
    pg_any           = ' pg_any = [a-zA-Z0-9_.,\t ]'                                                + nl,
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
    pg_rpt_sht       = ' pg_rpt_sht = pg_rpt_name pg_c_ext pg_col pg_rpt_ln pg_col pg_test_prefix pg_char+ pg_col pg_passfail'  + nl,
    pg_rpt_lng       = ' pg_rpt_lng = pg_rpt_sht inner_msg* pg_rpt_sht \n inner_msg = ( !pg_rpt_sht ( src_char / "\\n" )) '     + nl,
    pg_rpt           = ' pg_rpt = pg_rpt_lng / pg_rpt_sht'                                                                      + nl,
    pg_rpt_footer    = ' pg_rpt_footer = digit+ " Tests " digit+ " Failures " digit+ " Ignored" pg_nl_seq'                      + nl,
    pg_gdefs         = pg_ws + pg_min_ws + pg_all_ws,
    pg_fdefs         = pg_char + pg_void + pg_int + pg_op_paren + pg_cl_paren +
      pg_test_prefix + pg_name + pg_params + pg_body,
    pg_idefs         = pg_linclude + pg_ginclude + pg_hinclude + pg_includelname +
      pg_includegname + pg_sp_mk + pg_fnchar + pg_op_an_br + pg_cl_an_br;

var pg_defs =
      pg_function        +
      pg_include         +
      pg_rpt             +
      pg_rpt_footer      +
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
      pg_rpt_sht;
//      +
//      pg_rpt_lng;

buildPgScript = function() {
  return pg_defs;
};

//buildPgScript = function() {
//  return pg_gdefs + pg_function + pg_fdefs + pg_include + pg_idefs;
//};

buildParser = function(string){
//  return PEG.buildParser(string,parserOptions);
  return PEG.buildParser(string,{});
};

parse = function(parser, x){
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

//this.generateParserSource(buildPgScript(), pegFilename);
//console.log('here');

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
    //    showExc = true;
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

  //  var p = buildParser('sm =  pg_sp_mk pg_all_ws pg_char+  pg_all_ws pg_sp_mk ' + pg_sp_mk + pg_all_ws + pg_char);
  var p = buildParser(' p = pg_sp_mk pg_all_ws pg_fnchar+  pg_all_ws pg_sp_mk' + nl + pg_sp_mk + pg_fnchar + pg_gdefs);

  it('should parse a name in speech marks', function(){
    assert.deepEqual(['"',[],['a','b','c'],[],'"'],parse(p, '"abc"'));
  });

  it('should parse a name in speech marks with proceeding whitespace', function(){
    assert.deepEqual(['"',[' '],['a','b','c'],[],'"'],parse(p, '" abc"'));
  });

  it('should parse a name in speech marks with trailing whitespace', function(){
    assert.deepEqual(['"',[' '],['a','b','c'],[' ',' '],'"'],parse(p, '" abc  "'));
  });

  it('should parse a filename in speech marks', function(){
    assert.deepEqual(['"',[' '],['f','i','l','e','n','a','m','e','.','h'],[' ',' '],'"'],parse(p, '" filename.h  "'));
  });
});

describe('Local header  parsing final', function() {

  //  var p = buildParser('sm =  pg_sp_mk pg_all_ws pg_char+  pg_all_ws pg_sp_mk ' + pg_sp_mk + pg_all_ws + pg_char);
  var p = buildParser(pg_includelname + nl + pg_sp_mk + pg_fnchar + pg_gdefs);

  it('should parse a name in speech marks', function(){
    assert.deepEqual(['"',[],['a','b','c'],[],'"'],parse(p, '"abc"'));
  });

  it('should parse a name in speech marks with proceeding whitespace', function(){
    assert.deepEqual(['"',[' '],['a','b','c'],[],'"'],parse(p, '" abc"'));
  });

  it('should parse a name in speech marks with trailing whitespace', function(){
    assert.deepEqual(['"',[' '],['a','b','c'],[' ',' '],'"'],parse(p, '" abc  "'));
  });

  it('should parse a filename in speech marks', function(){
    assert.deepEqual(['"',[' '],['f','i','l','e','n','a','m','e','.','h'],[' ',' '],'"'],parse(p, '" filename.h  "'));
  });
});

describe('Global header parsing', function() {

  //  var p = buildParser('sm =  pg_sp_mk pg_all_ws pg_char+  pg_all_ws pg_sp_mk ' + pg_sp_mk + pg_all_ws + pg_char);
  var p = buildParser(' p = pg_op_an_br pg_all_ws pg_fnchar+  pg_all_ws pg_cl_an_br' + nl + pg_op_an_br + pg_cl_an_br + pg_fnchar + pg_gdefs);

  it('should parse a name in angle brackets', function(){
    assert.deepEqual(['<',[],['a','b','c'],[],'>'],parse(p, '<abc>'));
  });

  it('should parse a name in angle brackets with proceeding whitespace', function(){
    assert.deepEqual(['<',[' '],['a','b','c'],[],'>'],parse(p, '< abc>'));
  });

  it('should parse a name in angle brackets with trailing whitespace', function(){
    assert.deepEqual(['<',[' '],['a','b','c'],[' ',' '],'>'],parse(p, '< abc  >'));
  });

  it('should parse a filename in angle brackets', function(){
    assert.deepEqual(['<',[' '],['f','i','l','e','n','a','m','e','.','h'],[' ',' '],'>'],parse(p, '< filename.h  >'));
  });
});

describe('Global header parsing final', function() {

  //  var p = buildParser('sm =  pg_sp_mk pg_all_ws pg_char+  pg_all_ws pg_sp_mk ' + pg_sp_mk + pg_all_ws + pg_char);
  var p = buildParser(pg_includegname + nl + pg_op_an_br + pg_cl_an_br + pg_fnchar + pg_gdefs);

  it('should parse a name in angle brackets', function(){
    assert.deepEqual(['<',[],['a','b','c'],[],'>'],parse(p, '<abc>'));
  });

  it('should parse a name in angle brackets with proceeding whitespace', function(){
    assert.deepEqual(['<',[' '],['a','b','c'],[],'>'],parse(p, '< abc>'));
  });

  it('should parse a name in angle brackets with trailing whitespace', function(){
    assert.deepEqual(['<',[' '],['a','b','c'],[' ',' '],'>'],parse(p, '< abc  >'));
  });

  it('should parse a filename in angle brackets', function(){
    assert.deepEqual(['<',[' '],['f','i','l','e','n','a','m','e','.','h'],[' ',' '],'>'],parse(p, '< filename.h  >'));
  });
});

describe('Parsing global and local includes', function() {
  var p = buildParser('pg_includename = pg_includelname / pg_includegname' + nl +
                      pg_includelname + pg_includegname +
                      pg_fnchar + pg_gdefs + pg_op_an_br + pg_cl_an_br + pg_sp_mk);

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
  var p = buildParser(pg_include  + pg_gdefs + pg_fdefs + pg_fdefs + pg_idefs);

  it('should parse a local filename', function(){
    //    assert.deepEqual(['"',[],['a','b','c','.','h'],[],'"'],parse(p, '"sss"'));
  });
});

describe('Parse Test Results String', function() {
  it('should parse a test filename with lower case extension', function(){
    var p = buildParser('pg_rpt_name = pg_name + pg_c_ext' + nl + pg_test_prefix + pg_name + pg_char + pg_c_ext);
    assert.deepEqual([[['test', ['u','n','i','t','y','_','R','u','n','n','e','r']]],['.','c']], parse(p, 'testunity_Runner.c'));
    assert.deepEqual([[['test', ['_','z']]],['.','c']], parse(p, 'test_z.c'));
    assert.deepEqual([[['test', ['_','8']]],['.','c']], parse(p, 'test_8.c'));
  });

  it('should parse a test filename with upper case extension', function(){
    var p = buildParser('pg_rpt_name = pg_name + pg_c_ext' + nl + pg_test_prefix + pg_name + pg_char + pg_c_ext);
    assert.deepEqual([[['test', ['u','n','i','t','y','_','R','u','n','n','e','r']]],['.','C']], parse(p, 'testunity_Runner.C'));
    assert.deepEqual([[['test', ['a']]],['.','C']], parse(p, 'testa.C'));
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
      'pg_rpt = pg_rpt_sht ' + nl
        + pg_rpt_sht + digit + pg_char + pg_test_prefix
        + pg_rpt_name + pg_c_ext + pg_col + pg_rpt_ln
        + nonzero_digit + pg_passfail);
    assert.deepEqual([[['test'],['u','n','i','t','y','_','R','u','n','n','e','r']],
                      ['.','c'],':',['9',['4']],':','Test',['_','T','r','u','e'],':','PASS'],
                     parse(p, 'testunity_Runner.c:94:Test_True:PASS'));

    assert.deepEqual([[['test'],['1']],['.','C'],':',['1',[]],':','Test',['_','N','i','l'],':','FAIL'],
                     parse(p, 'test1.C:1:Test_Nil:FAIL'));

    assert.deepEqual([[['test'],['1']],['.','C'],':',['1',[]],':','Test',['_','N','i','l'],':','FAIL'],
                     parse(p, 'test1.C:1:Test_Nil:FAIL'));
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
    //    assert.deepEqual('ab', parse(p, 'ab:PASS'));
  });


  //  it('should parse whole message', function(){
  //    var str =
  //          //          'pg_rpt_exfail = pg_rpt_name pg_c_ext pg_col pg_rpt_ln pg_col pg_test_prefix pg_char+ pg_col pg_passfail + " " pg_any* pg_col pg_passfail';
  //          //          'a = pg_rpt_sht pg_col " "'
  //          //          'a = pg_rpt_sht pg_col " "' + nl
  //          //          'a = pg_rpt_sht pg_col pg_ws [a-zA-Z0-9 \t] [a-zA-Z0-9 \t] [a-zA-Z0-9 \t] pg_rpt_sht' + nl
  //          //          'aaaa = pg_rpt_sht aaaa pg_rpt_sht / ": " [a-su-zA-SU-Z \t]+' + nl
  //          'aaaa = pg_rpt_sht ": " ([a-st-zA-Z ]+ &pg_rpt_sht)' + nl
  //    //            'a = pg_rpt_sht pg_col pg_rpt_sht' + nl
  //          + pg_rpt_sht + digit + pg_char + pg_test_prefix
  //          + pg_rpt_name + pg_c_ext + pg_col + pg_rpt_ln
  //          + nonzero_digit + pg_passfail + pg_any + pg_ws;
  //    var match =
  //          //          'testunity_Runner.c:3357:Test_NotEqualDoubleArraysExpectedNull:PASS: ';
  //          //          'testunity_Runner.c:3357:Test_NotEqualDoubleArraysExpectedNull:FAIL: testunity_Runner.c:3348:Test_NotEqualDoubleArraysExpectedNull:PASS';
  //          //          'testunity_Runner.c:3357:Test_NotEqualDoubleArraysExpectedNull:FAIL: abc def ghi jkl mno pqr suv wxy zAB CDE FGH IJK LMN OPQ RSU VWXYZ testunity_Runner.c:3348:Test_NotEqualDoubleArraysExpectedNull:PASS';
  //          //    var p = buildParser(str); //Expected pointer to be NUL
  //          //    assert.deepEqual([] , parse(p, match));
  //          //  });
  //
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

//    var p = buildParser('a = t1:pg_rpt_sht im:inner_msg* t2:pg_rpt_sht  {return [t1[0][1][0], t2[1][1][0], t2[8], im.join("") ]  } \n inner_msg = ( !pg_rpt_sht ( src_char / "\\n" ))  ' + nl
//                        + pg_rpt_sht + pg_rpt_name + pg_c_ext + pg_col + pg_rpt_ln+
//                        pg_test_prefix + pg_char + pg_passfail + nonzero_digit +
//                        digit + src_char + nl
//                        , {trace: true});
//
//    var p = buildParser('a = t1:pg_rpt_sht im:inner_msg* t2:pg_rpt_sht  {return [t1[0][1][0], t2[1][1][0], t2[8], im.join("") ]  } \n inner_msg = ( !pg_rpt_sht ( src_char / "\\n" ))  ' + nl
//                        + pg_rpt_sht + pg_rpt_name + pg_c_ext + pg_col + pg_rpt_ln+
//                        pg_test_prefix + pg_char + pg_passfail + nonzero_digit +
//                        digit + src_char + nl
//                        , {trace: true});
//
//    var p = buildParser('rpt = rpt_lng / pg_rpt_sht \n rpt_lng = pg_rpt_sht inner_msg* pg_rpt_sht \n inner_msg = ( !pg_rpt_sht ( src_char / "\\n" ))  ' + nl
//                        + pg_rpt_sht + pg_rpt_name + pg_c_ext + pg_col + pg_rpt_ln+
//                        pg_test_prefix + pg_char + pg_passfail + nonzero_digit +
//                        digit + src_char + nl
//                        , {trace: true});

    var p = buildParser(
      pg_rpt_lng + nl
        + pg_rpt_sht + pg_rpt_name + pg_c_ext + pg_col + pg_rpt_ln+
        pg_test_prefix + pg_char + pg_passfail + nonzero_digit +
        digit + src_char + nl
      , {trace: true});

    //                        ( !")"  (. / "\\n") )* ")" ', {trace: true});
    assert.isArray(parse(p, 'testa.c:1:Testb:FAIL: atesta.c:2:Testb:FAIL'));
    assert.isArray(parse(p, 'testunity_Runner.c:3483:testNotEqualDoubleArraysInf:FAIL: Element 1 Values Not Within Delta testunity_Runner.c:3474:testNotEqualDoubleArraysInf:PASS'));




    var p = buildParser(
      pg_rpt_lng + nl
        + pg_rpt_sht + pg_rpt_name + pg_c_ext + pg_col + pg_rpt_ln+
        pg_test_prefix + pg_char + pg_passfail + nonzero_digit +
        digit + src_char + nl
      , {trace: true});

    var p = buildParser(pg_rpt_lng + pg_defs,{trace: true});

    var f = fs.readFileSync('/Users/martyn/_unity_quick_setup/dev/Unity/test/build/testunity.txt');
    var ary = f.toString().split('\n');
    var good = 0;
    var failures = [];
    var parsed   = []
    for(var count = 0; count < ary.length; count++){
      parsed[count] = parse(p, ary[count]);
      console.log(parsed[count]);
      if(parsed !== false){
        console.log(++good, 'parsed a good one!', 'line:', count + 1);
      }
      else{
        failures.push(count + 1);
      }
    }

    console.log('the following lines failed to parse:');
    for(var count = 0; count < failures.length; count++){
      console.log('line ', failures[count] + '');
      console.log(parsed[count]);
    };
    console.log(ary[ary.length - 5]);
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

describe('Parse Test Fails as Expected', function() {
  var p = buildParser(
    'a =  pg_rpt_lng / pg_rpt_sht ' + nl
      + pg_defs
//    pg_rpt_sht + pg_rpt_name + pg_c_ext + pg_col + pg_rpt_ln+
//      pg_test_prefix + pg_char + pg_passfail + nonzero_digit +
//      digit + src_char + nl
    , {trace: true});
  var scr = 'test_z_Runner.c:116:Test_NotVanilla:FAIL: Expression Evaluated To FALSEtest_z_Runner.c:113:Test_NotVanilla:PASS';
//  var scr = 'test_z_Runner.c:1175:Test_INT32sNotWithinDelta:FAIL: Values Not Within Delta 1 Expected -3 Was 1test_z_Runner.c:1172:Test_INT32sNotWithinDelta:FAIL';
  it('should pass since test failed as expected', function(){
    var parsed = parse(p, scr)
    assert.deepEqual('test' , parsed);
  });
});



  //
  //  it('should parse a local filename with preceding whitespace', function(){
  //    assert.deepEqual(['"',[' '],['a','b','c','.','h'],[],'"'],parse(p, '" abc.h"'));
  //  });
  //
  //  it('should parse a local filename with trailing whitespace', function(){
  //    assert.deepEqual(['"',[],['a','b','c','.','h'],[' '],'"'],parse(p, '"abc.h "'));
  //  });
  //
  //  it('should parse a global filename', function(){
  //    assert.deepEqual(['<',[],['a','b','c','.','h'],[],'>'],parse(p, '<abc.h>'));
  //  });
  //
  //  it('should parse a global filename with preceding whitespace', function(){
  //    assert.deepEqual(['<',[' '],['a','b','c','.','h'],[],'>'],parse(p, '< abc.h>'));
  //  });
  //
  //  it('should parse a global filename with trailing whitespace', function(){
  //    assert.deepEqual(['<',[],['a','b','c','.','h'],[' '],'>'],parse(p, '<abc.h >'));
  //  });

  //  it('should parse a #included filename with proceeding whitespace', function(){
  //    assert.deepEqual(['"',[' ',' ',' '],['a','b','c'],[],'"'],parse(p, '"   abc"'));
  //  });
  //
  //  it('should parse a #included filename with proceeding whitespace', function(){
  //    assert.deepEqual(['"',[' ',' ',' '],['a','b','c'],[],'"'],parse(p, '"   abc"'));
  //  });
  //
  //  it('should parse a #included filename with proceeding whitespace', function(){
  //    assert.deepEqual(['"',[' ',' ',' ',' '],['a','b','c'],[],'"'],parse(p, '"    abc"'));
  //  });

//describe('filename in speech marks parsing', function() {
//
//  var p = buildParser('sm = pg_includelname  ' + pg_sp_mk + pg_all_ws + pg_includelname + pg_char);
//
//  it('should parse a local include filename', function(){
//    assert.deepEqual(['"', [], ['a', 'b', 'c'],[], '"'],parse(p, '"abc"'));
//  });
//
//   it('should parse a local include filename with proceeding whitespace', function(){
//     assert.deepEqual(['"', [' ', ' '], ['a', 'b', 'c'],[], '"'],parse(p, '"  abc"'));
//   });
//});
//
//describe('Include Header Local File Parsing:', function() {
//
//  var p = buildParser(pg_linclude + pg_all_ws + pg_hinclude + pg_min_ws + pg_includelname + pg_char + pg_sp_mk);
//
//  it('should parse #include with local include name', function(){
//    assert.deepEqual([[], '#include',[' '],['"',[],['n', 'a', 'm', 'e'],[],'"']], parse(p, '#include "name"'));
//    assert.deepEqual([[' ',' '], '#include',[' '],['"',[],['n', 'a', 'm', 'e'],[],'"']], parse(p, '  #include "name"'));
//    assert.deepEqual([[' ',' '], '#include',[' '],['"',[' '],['n', 'a', 'm', 'e'],[],'"']], parse(p, '  #include " name"'));
//    assert.deepEqual([[' ',' '], '#include',[' ',' '],['"',[' ', ' '],['n', 'a', 'm', 'e'],[' ',' '],'"']],
//                     parse(p, '  #include  "  name  "'));
//  });
//});
//
//describe('opening angle pracket parsing:', function() {
//  var p = buildParser(pg_op_an_br);
//  it('should parse <', function() {
//    assert.deepEqual('<' ,parse(p, '<'));
//  });
//});
//
//describe('closing angle pracket parsing', function() {
//  p = buildParser(pg_cl_an_br);
//  it('should parse >', function() {
//    assert.deepEqual('>',parse(p,'>'));
//  });
//});
//
//describe('Include Header Global File Parsing:', function() {
//
//  var p = buildParser(pg_includegname + pg_op_an_br + pg_all_ws + pg_char + pg_cl_an_br);
//
//  it('should parse global header filename', function(){
//    assert.deepEqual(['<', [], ['n', 'a', 'm', 'e'], [], '>'], parse(p, '<name>'));
//  });
//
//  it('should parse global header filename with leading whitespace', function(){
//    assert.deepEqual(['<', [' '], ['n', 'a', 'm', 'e'], [], '>'], parse(p, '< name>'));
//    assert.deepEqual(['<', [' ',' '], ['n', 'a', 'm', 'e'], [], '>'], parse(p, '<  name>'));
//  });
//
//  it('should parse global header filename with trailing whitespace', function(){
//    assert.deepEqual(['<', [], ['n', 'a', 'm', 'e'], [' '], '>'], parse(p, '<name >'));
//    assert.deepEqual(['<', [], ['n', 'a', 'm', 'e'], [' ',' '], '>'], parse(p, '<name  >'));
//  });
//});
//
//describe('Include Header Global File Parsing:', function() {
//
//  var p = buildParser(pg_ginclude + pg_all_ws + pg_hinclude + pg_min_ws + pg_includegname + pg_op_an_br + pg_char + pg_cl_an_br);
//
//  it('should parse #include with global include name', function() {
//    assert.deepEqual([[], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '#include <name>'));
//    assert.deepEqual([[' '], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, ' #include <name>'));
//    assert.deepEqual([[' ',' '], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '  #include <name>'));
//    assert.deepEqual([[' ',' '], '#include',[' ',' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '  #include  <name>'));
//    assert.deepEqual([[' ',' '], '#include',[' ',' '],['<',[' '],['n', 'a', 'm', 'e'],[' '],'>']], parse(p, '  #include  < name >'));
//
//  });
//});
//
//describe('Include Combined Global and Local Include File Parsing:', function() {
//  var p = buildParser(pg_include + pg_linclude + pg_ginclude +
//                      pg_all_ws + pg_hinclude + pg_min_ws +
//                      pg_includelname + pg_includegname +
//                      pg_sp_mk + pg_char + pg_op_an_br +
//                      pg_cl_an_br);
//
//  it('should parse local header', function() {
//    assert.deepEqual([[], '#include',[' '],['"',[],['n', 'a', 'm', 'e'],[],'"']], parse(p, '#include "name"'));
//    assert.deepEqual([[' ',' '], '#include',[' '],['"',[],['n', 'a', 'm', 'e'],[],'"']], parse(p, '  #include "name"'));
//  assert.deepEqual([[' ',' '], '#include',[' '],['"',[' '],['n', 'a', 'm', 'e'],[],'"']], parse(p, '  #include " name"'));
//    assert.deepEqual([[' ',' '], '#include',[' ',' '],['"',[' ', ' '],['n', 'a', 'm', 'e'],[' ',' '],'"']], parse(p, '  #include  "  name  "'));
//  });
//
//  it('should parse global header', function() {
//    assert.deepEqual([[], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '#include <name>'));
//  });
//  assert.deepEqual([[' '], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, ' #include <name>'));
//  assert.deepEqual([[' ',' '], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '  #include <name>'));
//  assert.deepEqual([[' ',' '], '#include',[' ',' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '  #include  <name>'));
//  assert.deepEqual([[' ',' '], '#include',[' ',' '],['<',[' '],['n', 'a', 'm', 'e'],[' '],'>']], parse(p, '  #include  < name >'));
//})
