"use strict";

var T           = require('./tokens').tokens,
    SYMBOLS     = require('./tokens').symbols,
    KEYWORDS    = require('./tokens').keywords;

function space_p(ch) {
    return ch === ' ' || ch === '\t';
}

function hex_digit_p(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 48 && c <= 57)
                    || (c >= 65 && c <= 70)
                    || (c >= 97 && c <= 102);
}

function binary_digit_p(ch) {
    var c = ch.charCodeAt(0);
    return c === 48 || c === 49;
}

function digit_p(ch) {
    var c = ch.charCodeAt(0);
    return c >= 48 && c <= 57;
}

function ident_start_p(ch) {
    var c = ch.charCodeAt(0);
    return (c === 95)
                    || (c >= 65 && c <= 90)
                    || (c >= 97 && c <= 122);
}

function ident_rest_p(ch) {
    return ident_start_p(ch) || digit_p(ch);
}

function color_rest_p(ch) {
    var c = ch.charCodeAt(0);
    return (c === 95)
                    || (c >= 65 && c <= 90)
                    || (c >= 97 && c <= 122)
                    || (c >= 48 && c <= 57);
}

module.exports = function(src) {

    var OP_RE     = /^(<=|>=|<<|>>|==|\!=|\*\*|\|\||&&|[\.,;=\-\+\*\/%\!<>~^\|\&\{\}\[\]\(\)])/;
    
    var p         = 0,            /* current position in src */
        len       = src.length,   /* length of src */
        tok       = null,         /* result of last call to nextToken() */
        text      = null,         /* parsed text of last token */
        start     = null,         /* temporary marker for start of token being lexed */
        error     = null,         /* error */
        curLine   = 1,
        curCol    = 1,
        tokLine   = null,
        tokCol    = null;
    
    function more() { return p < len - 1; }
    function two_more() { return p < len - 2; }
    function adv(n) { n = n || 1; p += n; curCol += n; }
    
    function nextToken() {
        
        text = null;
        
        if (p === len)
            return T.EOF;
        
        // skip whitespace
        while (space_p(src[p])) {
            adv();
            if (p === len)
                return T.EOF;
        }
        
        // skip comments
        if (src[p] === '-' && more() && src[p+1] === '-') {
            adv(2);
            while (true) {
                if (p === len)
                    return T.EOF;
                if (src[p] === '\r' || src[p] === '\n')
                    break;
                adv();
            }
        }
        
        // if we get to this point we known we're at a token
        // stash its position in the source.
        tokLine = curLine;
        tokCol = curCol;
        
        // newline
        if (src[p] === '\n') {
            p++;
            curLine++;
            curCol = 1;
            return T.NEWLINE;
        }

        var matchResult = OP_RE.exec(src.substring(p));
        if (matchResult) {
            adv(matchResult[0].length);
            return SYMBOLS[matchResult[0]];
        }
        
        var ch = src[p];
        switch (ch) {
            case '$':
                if (more() && ident_start_p(src[p+1])) {
                    start = ++p;
                    while (more() && ident_rest_p(src[p+1]))
                        adv();

                    text = src.substring(start, p + 1);
                    tok = T.GLOBAL_IDENT;
                } else {
                    error = "expected: global variable name";
                    tok = T.ERROR;
                }
                break;
            case '\r':
                if (more() && src[p+1] === '\n') {
                    p++;
                }
                curLine++;
                curCol = 0; // column will be advanced to 1 at function end
                tok = T.NEWLINE;
                break;
            default:
                if (ch === '#') {
                    
                    start = p;
                    
                    if (more() && color_rest_p(src[p+1])) {
                        while (more() && color_rest_p(src[p+1]))
                            adv();
                            
                        text = src.substring(start, p + 1);
                        tok = T.COLOR;
                    } else {
                        error = "invalid colour literal";
                        tok = T.ERROR;
                    }
                    
                } else if (ident_start_p(ch)) {
                    
                    start = p;
                    while (more() && ident_rest_p(src[p+1]))
                        adv();
                    
                    text = src.substring(start, p + 1);
                    tok = KEYWORDS[text] || T.IDENT;
                    
                } else if (digit_p(ch)) {
                    
                    if (ch === '0' && two_more() && src[p+1] === 'x' && hex_digit_p(src[p+2])) {
                        
                        start = p;
                        adv(2);
                        
                        while (more() && hex_digit_p(src[p+1]))
                            adv();
                        
                        text = src.substring(start, p + 1);
                        tok = T.HEX;
                        
                    } else if (ch === '0' && two_more() && src[p+1] === 'b' && binary_digit_p(src[p+2])) {
                        
                        start = p;
                        adv(2);
                        
                        while (more() && binary_digit_p(src[p+1]))
                            adv();
                            
                        text = src.substring(start, p + 1);
                        tok = T.BINARY;
                        
                    } else {
                        
                        start = p;
                        
                        while (more() && digit_p(src[p+1]))
                            adv();
                            
                        if (more() && src[p+1] === '.') {
                            adv();
                            if (!more() || !digit_p(src[p+1])) {
                                error = "invalid float literal";
                                tok = T.ERROR;
                            } else {
                                while (more() && digit_p(src[p+1]))
                                    adv();
                                text = src.substring(start, p + 1);
                                tok = T.FLOAT;
                            }
                        } else {
                            text = src.substring(start, p + 1);
                            tok = T.INTEGER;
                        }
                        
                    }
                    
                } else if (ch === '"') {
                    
                    var skip = false;
                    
                    start = p;
                    
                    error = "unterminated string literal";
                    tok = T.ERROR;
                    
                    while (more()) {
                        adv();
                        if (skip) {
                            skip = false;
                        } else if (src[p] === '\\') {
                            skip = true;
                        } else if (src[p] === '"') {
                            text = src.substring(start + 1, p); // TODO: parse string
                            error = null;
                            tok = T.STRING;
                            break;
                        }
                    }
                    
                } else {
                    error = "unexpected character in input: '" + ch + "'";
                    tok = T.ERROR;
                }
                
                break;
        }
        
        adv();
        return tok;

    }
    
    return {
        next          : nextToken,                      /* advance to next token and return */
        text          : function() { return text; },    /* text of current token */
        error         : function() { return error; },   /* error message */
        line          : function() { return tokLine; }, /* start line of current token */
        column        : function() { return tokCol; }   /* start column of current token */
    };
    
};