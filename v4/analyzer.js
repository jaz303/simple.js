module.exports = create;

var CodeObject = require('./runtime/CodeObject');
var A = require('./ast');

function create() {

	var codeObjects = [null];
	var scopes = [];

	function scope() {
		return scopes[scopes.length-1];
	}

	function pushScope() {
		var newScope = new Scope(scope());
		scopes.push(newScope);
		return newScope;
	}

	function popScope() {
		scopes.pop();
	}

	function addImplicitReturn(functionBody) {
		if (functionBody.length === 0) {
			// TODO: 
			throw new Error("need to decide wtf a void value is!");
		} else {
			var lastStatement = functionBody[functionBody.length-1];
			if (lastStatement.type !== A.RETURN) {
				lastStatement = new A.Return(lastStatement);
				functionBody[functionBody.length-1] = lastStatement;
			}
		}
	}

	//
	//

	function walk(node) {
		switch (node.type) {
			case A.ARRAY_LITERAL: return walkArrayLiteral(node);
			case A.ASSIGN: return walkAssign(node);
			case A.CALL: return walkCall(node);
			case A.COMPUTED_MEMBER: return walkComputedMember(node);
			case A.DICT_LITERAL: return walkDictLiteral(node);
			case A.FN: return walkFn(node);
			case A.GLOBAL_DICT: return walkGlobalDict(node);
			case A.GLOBAL_IDENT: return walkGlobalIdent(node);
			case A.IDENT: return walkIdent(node);
			case A.IF: return walkIf(node);
			case A.LAMBDA: return walkLambda(node);
			case A.LITERAL: return walkLiteral(node);
			case A.LOOP: return walkLoop(node);
			case A.MISSING_ARG: return walkMissingArg(node);
			case A.MODULE: return walkModule(node);
			case A.RETURN: return walkReturn(node);
			case A.SPAWN: return walkSpawn(node);
			case A.STATIC_MEMBER: return walkStaticMember(node);
			case A.STATEMENTS: return walkStatements(node);
			case A.WHILE: return walkWhile(node);
			case A.YIELD: return walkYield(node);
			default:
				if (node.type & A.BIN_OP) {
					walkBinOp(node);
				} else if (node.type & A.UN_OP) {
					walkUnOp(node);
				} else {
					var err = new Error("unknown type: " + node.type);	
					throw err;
				}
		}
	}

	function walkAll(ary) {
		ary.forEach(walk);
	}

	function walkArrayLiteral(node) {
		walkAll(node.elements);
	}

	function walkAssign(node) {
		walk(node.assignee);
		walk(node.value);
	}

	function walkBinOp(node) {
		walk(node.left);
		walk(node.right);
	}

	function walkCall(node) {
		walk(node.callee);
		walkAll(node.args);
	}

	function walkComputedMember(node) {
		walk(node.subject);
		walk(node.memberExp);
	}

	function walkDictLiteral(node) {
		walkAll(node.values);
	}

	function walkFn(node) {
		// when we see a named function definition we need to:

		// 1. create its code object
		// var codeObjectIndex = codeObjects.length;
		// codeObjects.push(node.createCodeObject());
		
		// 2. insert an instance into the active scope
		scope().addNamedFunction(node.name, node.createCodeObject());

		// 3. add implicit return if necessary
		addImplicitReturn(node.body.statements);

		node.scope = pushScope();
		walk(node.body);
		popScope();
	}

	function walkGlobalDict(node) {
		// no-op
	}

	function walkGlobalIdent(node) {
		// no-op
	}

	function walkIdent(node) {
		// no-op
	}

	function walkIf(node) {
		for (var i = 0; i < node.conditions.length; ++i) {
			if (node.conditions[i]) {
				walk(node.conditions[i]);	
			}
			walk(node.bodies[i]);
		}
	}

	function walkLambda(node) {
		addImplicitReturn(node.body.statements);
		node.scope = pushScope();
		walk(node.body);
		popScope();
	}

	function walkLiteral(node) {
		// no-op
	}

	function walkLoop(node) {
		walk(node.body);
	}

	function walkMissingArg(node) {
		// no-op
	}

	function walkReturn(node) {
		walk(node.value);
	}

	function walkSpawn(node) {
		walk(node.callee);
		walkAll(node.args);
	}

	function walkStatements(node) {
		walkAll(node.statements);
	}

	function walkStaticMember(node) {
		walk(node.subject);
	}

	function walkUnOp(node) {
		walk(node.exp);
	}

	function walkWhile(node) {
		walk(node.condition);
		walk(node.body);
	}

	function walkYield(node) {
		// no-op
	}

	//
	//

	return {
		analyze: function(module) {
			module.scope = pushScope();
			walkStatements(module.statements);
			popScope();
		}
	};

}

function Scope(parent) {
	this.parent = parent;
	this.symbols = {};
}

Scope.prototype.addNamedFunction = function(name, codeObject) {
	this.symbols[name] = codeObject;
}