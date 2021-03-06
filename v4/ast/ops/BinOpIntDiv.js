module.exports = BinOpIntDiv

var floor = Math.floor;

function BinOpIntDiv(left, right) {
    this.left = left;
    this.right = right;
}

BinOpIntDiv.prototype.type = require('../type')('BIN_OP_INT_DIV', {binOp: true});

BinOpIntDiv.prototype.evaluate = function(ctx, env, cont, err) {
    var right = this.right;
    return this.left.evaluate(ctx, env, function(l) {
        return right.evaluate(ctx, env, function(r) {
            if (typeof l !== 'number' || typeof r !== 'number') {
                return ctx.thunk(err, new Error('\: arguments must be numeric'));
            } else {
                return ctx.thunk(cont, floor(l / r));
            }
        }, err);
    }, err);
}