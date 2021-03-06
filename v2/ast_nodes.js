"use strict";

var AST_NODES = {};

var nextAstNode = 1;

[   'MODULE',

    'IMPORT',
    'EXPORT',

    'DEF',

    'WHILE',
    'LOOP',
    'IF',
    'FOREACH',

    'CALL',
    'ASSIGN',
    'RETURN',

    'IDENT',
    'INTEGER',
    'FLOAT',
    'STRING',

    'LOCALS',

    'COLOR',
    'COLOR_CTOR',
    'GLOBAL_IDENT',
    'GLOBAL_OBJECT',
    'LAMBDA',

    'ARRAY',
    'DICT',

    'ARRAY_DEREF',
    'PROP_DEREF',

    'MISSING_ARG',

    'RETURN',
    'YIELD',
    'SPAWN',
    'EVAL',
    'TRACE',

    'BIN_OP',
    'UN_OP'

].forEach(function(ast) {
    var astNodeId = nextAstNode++;
    AST_NODES[ast] = astNodeId;
});

module.exports = AST_NODES;
