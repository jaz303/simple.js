module.exports = Module;

function Module(path, ast) {
	this.path = path || '<<main>>';
	this.ast = ast;
}
