var mocha           = require('mocha');
var chai            = require('chai');
var assert          = chai.assert;
var fs              = require('fs');
var PEG             = require('pegjs');
var pg_min_ws       = ' pg_min_ws = [ \t]+ ';
var pg_all_ws       = ' pg_all_ws = [ \t]* ';
var pg_char         = ' pg_char   = [a-zA-Z0-9_] ';
var pg_sp_mk        = ' pg_sp_mk = \'"\' ';
var pg_op_an_br     = ' pg_op_an_br = "<" ';
var pg_cl_an_br     = ' pg_cl_an_br = ">" ';
var pg_includelname = ' pg_includelname = pg_sp_mk pg_all_ws pg_char+  pg_all_ws pg_sp_mk ';
var pg_includegname = ' pg_includegname = pg_op_an_br pg_all_ws pg_char+  pg_all_ws pg_cl_an_br ';
var pg_hinclude     = ' pg_hinclude = "#include" ';
var pg_linclude     = ' pg_linclude = pg_all_ws pg_hinclude pg_min_ws pg_includelname ';
var pg_ginclude     = ' pg_ginclude = pg_all_ws pg_hinclude pg_min_ws pg_includegname ';
var pg_include      = ' pg_include = pg_linclude / pg_ginclude ';
var flags           =
      {
        'showExc':   false,
        'voidFound': false,
        'scan': false,
        'debug': true
      };

exports.buildScript = function() {
  return pg_include;
};

buildPgScript = function() {
    var pg_start        = 'start = pg_function ',
        pg_min_ws       = 'pg_min_ws = [" "\\t]+',
        pg_all_ws       = 'pg_all_ws = [" "\\t]*',
        pg_void         = 'pg_void = "void"',
        pg_op_paren     = 'pg_op_paren = "("',
        pg_cl_paren     = 'pg_op_paren = ")"',
        pg_int          = 'pg_int = "int"',
        pg_char         = 'pg_char   = [a-zA-Z0-9_]',
        pg_name_prefix  = 'pg_name_prefix = "test" / "Test"',
        pg_name         = 'pg_name = pg_name_prefix pg_char+',
        pg_body         = "pg_body = '{' pg_body '}' / ('{'.*'}')",
        pg_params0      = 'pg_params = "(" pg_params ")" / "(" pg_all_ws ',
        pg_params1      = '(pg_void / (pg_int pg_min_ws pg_char+ ) / "")',
        pg_params2      = 'pg_all_ws ")" ',
        pg_params       = pg_params0 + pg_params1 + pg_params2,
        pg_function0    = 'pg_function = pg_all_ws pg_void pg_min_ws ',
        pg_function1    = 'pg_name pg_all_ws pg_params pg_all_ws .+ ',
        pg_function     = pg_function0 + pg_function1,
        nl              = '\n',
        pg_defs         = nl + pg_all_ws + nl + pg_char + nl + pg_void +
          nl + pg_int + nl + pg_op_paren + nl + pg_cl_paren + nl +  pg_min_ws +
          nl + pg_name_prefix + nl + pg_name + nl + pg_all_ws + nl + pg_params +
          nl + pg_body;
    return pg_start + pg_function + pg_defs;
}

var nl = '\n';
var digit            = "digit            = [0-9]";
var nonzero_digit    = "nonzero_digit    = [1-9]";
var octal_digit      = 'octal_digit      = [0-7]';
var hex_digit        = "hex_digit        = [0-9a-fA-F]";
var non_digit        = "non_digit        = [_a-zA-Z]";
var decimal_constant = 'decimal_constant = nonzero_digit digit*';
var octal_constant   = 'octal_constant   = "0" octal_digit*';
var hex_prefix       = 'hex_prefix       = "0x" / "0X"';
var hex_constant     = "hex_constant = hex_prefix hex_digit+";

buildParser = function(string){
  return PEG.buildParser(string);
}

parse = function(parser, x){
  try {
    return parser.parse(x);
  }
  catch(err) {
    if (flags.debug && flags.showExc)
      console.log(clc.magentaBright(err));
    return false;
  }
}

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

describe('Speach mark parsing', function() {

  var p = buildParser('sm =  pg_sp_mk pg_all_ws pg_char+  pg_all_ws pg_sp_mk ' + pg_sp_mk + pg_all_ws + pg_char);

  it('should parse a speech mark', function(){
    assert.deepEqual(['"',[' '],['a','b','c'],[' ',' '],'"'],parse(p, '" abc  "'));
  });
});

describe('filename in speech marks with proceeding space parsing', function() {

  var p = buildParser('sm = pg_includelname  ' + pg_sp_mk + pg_all_ws + pg_includelname + pg_char);

  it('should parse a filename', function(){
    assert.deepEqual(['"',[],['a','b','c'],[],'"'],parse(p, '"abc"'));
  });

  it('should parse a #included filename with proceeding whitespace', function(){
    assert.deepEqual(['"',[' ',' ',' '],['a','b','c'],[],'"'],parse(p, '"   abc"'));
  });

  it('should parse a #included filename with proceeding whitespace', function(){
    assert.deepEqual(['"',[' ',' ',' '],['a','b','c'],[],'"'],parse(p, '"   abc"'));
  });

  it('should parse a #included filename with proceeding whitespace', function(){
    assert.deepEqual(['"',[' ',' ',' ',' '],['a','b','c'],[],'"'],parse(p, '"    abc"'));
  });
});

describe('filename in speech marks parsing', function() {

  var p = buildParser('sm = pg_includelname  ' + pg_sp_mk + pg_all_ws + pg_includelname + pg_char);

  it('should parse a local include filename', function(){
    assert.deepEqual(['"', [], ['a', 'b', 'c'],[], '"'],parse(p, '"abc"'));
  });

   it('should parse a local include filename with proceeding whitespace', function(){
     assert.deepEqual(['"', [' ', ' '], ['a', 'b', 'c'],[], '"'],parse(p, '"  abc"'));
   });
});

describe('Include Header Local File Parsing:', function() {

  var p = buildParser(pg_linclude + pg_all_ws + pg_hinclude + pg_min_ws + pg_includelname + pg_char + pg_sp_mk);

  it('should parse #include with local include name', function(){
    assert.deepEqual([[], '#include',[' '],['"',[],['n', 'a', 'm', 'e'],[],'"']], parse(p, '#include "name"'));
    assert.deepEqual([[' ',' '], '#include',[' '],['"',[],['n', 'a', 'm', 'e'],[],'"']], parse(p, '  #include "name"'));
    assert.deepEqual([[' ',' '], '#include',[' '],['"',[' '],['n', 'a', 'm', 'e'],[],'"']], parse(p, '  #include " name"'));
    assert.deepEqual([[' ',' '], '#include',[' ',' '],['"',[' ', ' '],['n', 'a', 'm', 'e'],[' ',' '],'"']],
                     parse(p, '  #include  "  name  "'));
  });
});

describe('opening angle pracket parsing:', function() {
  var p = buildParser(pg_op_an_br);
  it('should parse <', function() {
    assert.deepEqual('<' ,parse(p, '<'));
  });
});

describe('closing angle pracket parsing', function() {
  p = buildParser(pg_cl_an_br);
  it('should parse >', function() {
    assert.deepEqual('>',parse(p,'>'));
  });
});

describe('Include Header Global File Parsing:', function() {

  var p = buildParser(pg_includegname + pg_op_an_br + pg_all_ws + pg_char + pg_cl_an_br);

  it('should parse global header filename', function(){
    assert.deepEqual(['<', [], ['n', 'a', 'm', 'e'], [], '>'], parse(p, '<name>'));
  });

  it('should parse global header filename with leading whitespace', function(){
    assert.deepEqual(['<', [' '], ['n', 'a', 'm', 'e'], [], '>'], parse(p, '< name>'));
    assert.deepEqual(['<', [' ',' '], ['n', 'a', 'm', 'e'], [], '>'], parse(p, '<  name>'));
  });

  it('should parse global header filename with trailing whitespace', function(){
    assert.deepEqual(['<', [], ['n', 'a', 'm', 'e'], [' '], '>'], parse(p, '<name >'));
    assert.deepEqual(['<', [], ['n', 'a', 'm', 'e'], [' ',' '], '>'], parse(p, '<name  >'));
  });
});

describe('Include Header Global File Parsing:', function() {

  var p = buildParser(pg_ginclude + pg_all_ws + pg_hinclude + pg_min_ws + pg_includegname + pg_op_an_br + pg_char + pg_cl_an_br);

  it('should parse #include with global include name', function() {
    assert.deepEqual([[], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '#include <name>'));
    assert.deepEqual([[' '], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, ' #include <name>'));
    assert.deepEqual([[' ',' '], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '  #include <name>'));
    assert.deepEqual([[' ',' '], '#include',[' ',' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '  #include  <name>'));
    assert.deepEqual([[' ',' '], '#include',[' ',' '],['<',[' '],['n', 'a', 'm', 'e'],[' '],'>']], parse(p, '  #include  < name >'));

  });
});

describe('Include Combined Global and Local Include File Parsing:', function() {
  var p = buildParser(pg_include + pg_linclude + pg_ginclude +
                      pg_all_ws + pg_hinclude + pg_min_ws +
                      pg_includelname + pg_includegname +
                      pg_sp_mk + pg_char + pg_op_an_br +
                      pg_cl_an_br);

  it('should parse local header', function() {
    assert.deepEqual([[], '#include',[' '],['"',[],['n', 'a', 'm', 'e'],[],'"']], parse(p, '#include "name"'));
    assert.deepEqual([[' ',' '], '#include',[' '],['"',[],['n', 'a', 'm', 'e'],[],'"']], parse(p, '  #include "name"'));
  assert.deepEqual([[' ',' '], '#include',[' '],['"',[' '],['n', 'a', 'm', 'e'],[],'"']], parse(p, '  #include " name"'));
    assert.deepEqual([[' ',' '], '#include',[' ',' '],['"',[' ', ' '],['n', 'a', 'm', 'e'],[' ',' '],'"']], parse(p, '  #include  "  name  "'));
  });
 
  it('should parse global header', function() {
    assert.deepEqual([[], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '#include <name>'));
  });
  assert.deepEqual([[' '], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, ' #include <name>'));
  assert.deepEqual([[' ',' '], '#include',[' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '  #include <name>'));
  assert.deepEqual([[' ',' '], '#include',[' ',' '],['<',[],['n', 'a', 'm', 'e'],[],'>']], parse(p, '  #include  <name>'));
  assert.deepEqual([[' ',' '], '#include',[' ',' '],['<',[' '],['n', 'a', 'm', 'e'],[' '],'>']], parse(p, '  #include  < name >'));
})
