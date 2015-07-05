module.exports = BinOpSub



function BinOpSub(left, right) {
    this.left = left;
    this.right = right;
}

BinOpSub.prototype.type = require('../type')('BIN_OP_SUB', {binOp: true});

BinOpSub.prototype.evaluate = function(ctx, env, cont, err) {
    var right = this.right;
    return this.left.evaluate(ctx, env, function(l) {
        return right.evaluate(ctx, env, function(r) {
            if (typeof l !== 'number' || typeof r !== 'number') {
                return ctx.thunk(err, new Error('-: arguments must be numeric'));
            } else {
                return ctx.thunk(cont, l - r);
            }
        }, err);
    }, err);
}