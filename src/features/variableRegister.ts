export class VariableRegister {
    private variables: { [key: string]: string };

    constructor() {
        this.variables = {};
    }

    public setVariable(key: string, value: string) {
        this.variables[key] = value;
    }

    public getVariable(key: string): string | undefined {
        return this.variables[key];
    }

    public clearVariable(key: string) {
        delete this.variables[key];
    }
}

// Example usage:
const variableRegister = new VariableRegister();
variableRegister.setVariable('userName', 'John Doe');
const userName = variableRegister.getVariable('userName');
