export class CommandRegister {
    private commands: { [key: string]: (args: string) => string };

    constructor() {
        this.commands = {
            'help': this.helpCommand,
            'clear': this.clearCommand,
            'greet': this.greetCommand,
            // Add more commands here
        };
    }

    public registerCommand(command: string, callback: (args: string) => string) {
        this.commands[command] = callback;
    }

    public executeCommand(command: string, args: string): string {
        if (this.commands[command]) {
            return this.commands[command](args);
        } else {
            return `Unknown command: ${command}`;
        }
    }

    private helpCommand(): string {
        return 'Available commands: help, clear, greet';
    }

    private clearCommand(): string {
        return 'Chat cleared.';
    }

    private greetCommand(name: string): string {
        return `Hello, ${name || 'user'}!`;
    }
}
