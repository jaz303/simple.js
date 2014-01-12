var A = require('./ast_nodes');

module.exports = function(ast) {

    var buffer      = '',
        currIndent  = 0;

    function tab() {
        for (var i = 0; i < currIndent; ++i) {
            buffer += '    ';
        }
    }

    function write(str) {
        buffer += str;
    }

    function indent() { currIndent += 1; }
    function outdent() { currIndent -= 1; }

    function emitExpression(node) {
        switch (node.type) {
            case A.INTEGER:
                write('(integer ' + node.value + ')');
                break;
            case A.FLOAT:
                write('(float ' + node.value + ')');
                break;
            case A.STRING:
                // TODO: encode string properly
                write('(string "' + node.value + '")');
                break;
            case A.TRACE:
                write('(trace)');
                break;
            case A.IDENT:
                write('(ident ' + node.name + ')');
                break;
            case A.GLOBAL_IDENT:
                write('(global-ident ' + node.name + ')');
                break;
            default:
                if (node === true) {
                    write('true');
                } else if (node === false) {
                    write('false');
                }
        }
    }

    function emitStatement(node) {

        if (buffer.length > 0) {
            write("\n");
        }
        
        switch (node.type) {
            case A.MODULE:
                buffer += '(module\n';
                indent();
                // tab();
                // write('(imports)\n');
                tab();
                write('(body');
                indent();
                emitStatements(node.body);
                write('))\n');
                outdent();
                outdent();
                break;
            default:
                tab();
                write('(expr ');
                emitExpression(node);
                write(')');
        }

    }

    function emitStatements(lst) {
        lst.forEach(emitStatement);
    }

    emitStatement(ast);

    return buffer;

}