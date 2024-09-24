"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpRegister = void 0;
class FollowUpRegister {
    followUpCallbacks;
    constructor() {
        this.followUpCallbacks = {};
    }
    registerFollowUp(key, callback) {
        this.followUpCallbacks[key] = callback;
    }
    executeFollowUp(key, response) {
        if (this.followUpCallbacks[key]) {
            return this.followUpCallbacks[key](response);
        }
        else {
            return `No follow-up registered for key: ${key}`;
        }
    }
}
exports.FollowUpRegister = FollowUpRegister;
// Example usage:
// After asking a question, store a follow-up like this:
const followUpRegister = new FollowUpRegister();
followUpRegister.registerFollowUp('askName', (response) => {
    return `Nice to meet you, ${response}!`;
});
//# sourceMappingURL=followUppRegister.js.map