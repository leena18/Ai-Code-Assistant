export class FollowUpRegister {
    private followUpCallbacks: { [key: string]: (response: string) => string };

    constructor() {
        this.followUpCallbacks = {};
    }

    public registerFollowUp(key: string, callback: (response: string) => string) {
        this.followUpCallbacks[key] = callback;
    }

    public executeFollowUp(key: string, response: string): string {
        if (this.followUpCallbacks[key]) {
            return this.followUpCallbacks[key](response);
        } else {
            return `No follow-up registered for key: ${key}`;
        }
    }
}

// Example usage:
// After asking a question, store a follow-up like this:
const followUpRegister = new FollowUpRegister();
followUpRegister.registerFollowUp('askName', (response) => {
    return `Nice to meet you, ${response}!`;
});
