"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableRegister = void 0;
class VariableRegister {
    variables;
    constructor() {
        this.variables = {};
    }
    setVariable(key, value) {
        this.variables[key] = value;
    }
    getVariable(key) {
        return this.variables[key];
    }
    clearVariable(key) {
        delete this.variables[key];
    }
}
exports.VariableRegister = VariableRegister;
// Example usage:
const variableRegister = new VariableRegister();
variableRegister.setVariable('userName', 'John Doe');
const userName = variableRegister.getVariable('userName');
//# sourceMappingURL=variableRegister.js.map