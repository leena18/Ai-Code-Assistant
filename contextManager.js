class ContextManager {
    static context = '';

    // Add new context
    static addContext(newContext) {
        if (typeof newContext === 'string') {
            if (this.context) {
                this.context += '\n' + newContext; // Concatenate with newline
            } else {
                this.context = newContext;
            }
        } else {
            console.error('Invalid context type. It must be a string.');
        }
    }

    // Retrieve all context
    static getContext() {
        return this.context;
    }

    // Clear all context
    static clearContext() {
        this.context = '';
    }
}

module.exports = ContextManager; // Export the class for use in other files
