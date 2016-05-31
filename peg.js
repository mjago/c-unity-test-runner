var PEG    = require('pegjs');
var clc    = require('cli-color');
var dbg    = require('./debug.js');
var pegFilename = './peg_parser.js';
var parser = require(pegFilename);

//var gp = require('./generate_parser.js');
//gp.generateParserSource(buildPgScript(), pegFilename);

exports.buildParser = function(string){
  return PEG.buildParser(string, {trace: false});
};

function parserInfo(parserName){
var parsers =
      {
        includeParser: {name: 'includeParser',
                        startRule: {startRule: 'pg_include'}},
        testParser:    {name: ' testParser',
                        startRule: {startRule: 'pg_function'}},
        rptParser:     {name: ' rptParser',
                        startRule: {startRule: 'pg_rpt'}},
        rptFooter:     {name: ' rptFooter',
                        startRule: {startRule: 'pg_rpt_footer'}}
      };
  return parsers[parserName];
}

function startRule(parser){
  return parserInfo(parser).startRule;
}

exports.parse = function(x, parserName){
  try {
    return parser.parse(x, startRule(parserName));
  }
  catch(err) {
    if (dbg.flags.debug)
      if(dbg.flags.showExc)
        console.log(clc.magentaBright(err));
    return false;
  }
};
