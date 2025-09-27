export class ValidationResult {
    errors = [];
    addError(field, message, code) {
        this.errors.push({ field, message, code });
    }
    get isValid() {
        return this.errors.length === 0;
    }
    get validationErrors() {
        return this.errors;
    }
    getFirstError(field) {
        if (field) {
            return this.errors.find(error => error.field === field);
        }
        return this.errors[0];
    }
}
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export const validateUsername = (username) => {
    const result = new ValidationResult();
    if (!username) {
        result.addError('username', 'Username is required', 'REQUIRED');
        return result;
    }
    if (username.length < 3) {
        result.addError('username', 'Username must be at least 3 characters long', 'MIN_LENGTH');
    }
    if (username.length > 30) {
        result.addError('username', 'Username must be no more than 30 characters long', 'MAX_LENGTH');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        result.addError('username', 'Username can only contain letters, numbers, underscores, and hyphens', 'INVALID_CHARACTERS');
    }
    return result;
};
export const validatePassword = (password) => {
    const result = new ValidationResult();
    if (!password) {
        result.addError('password', 'Password is required', 'REQUIRED');
        return result;
    }
    if (password.length < 8) {
        result.addError('password', 'Password must be at least 8 characters long', 'MIN_LENGTH');
    }
    if (password.length > 128) {
        result.addError('password', 'Password must be no more than 128 characters long', 'MAX_LENGTH');
    }
    if (!/(?=.*[a-z])/.test(password)) {
        result.addError('password', 'Password must contain at least one lowercase letter', 'MISSING_LOWERCASE');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
        result.addError('password', 'Password must contain at least one uppercase letter', 'MISSING_UPPERCASE');
    }
    if (!/(?=.*\d)/.test(password)) {
        result.addError('password', 'Password must contain at least one number', 'MISSING_NUMBER');
    }
    return result;
};
export const validateRoomName = (name) => {
    const result = new ValidationResult();
    if (!name) {
        result.addError('name', 'Room name is required', 'REQUIRED');
        return result;
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
        result.addError('name', 'Room name cannot be empty', 'EMPTY');
    }
    if (trimmedName.length > 50) {
        result.addError('name', 'Room name must be no more than 50 characters long', 'MAX_LENGTH');
    }
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmedName)) {
        result.addError('name', 'Room name can only contain letters, numbers, spaces, underscores, and hyphens', 'INVALID_CHARACTERS');
    }
    return result;
};
export const validateMessageContent = (content) => {
    const result = new ValidationResult();
    if (!content) {
        result.addError('content', 'Message content is required', 'REQUIRED');
        return result;
    }
    const trimmedContent = content.trim();
    if (trimmedContent.length < 1) {
        result.addError('content', 'Message content cannot be empty', 'EMPTY');
    }
    if (trimmedContent.length > 2000) {
        result.addError('content', 'Message content must be no more than 2000 characters long', 'MAX_LENGTH');
    }
    return result;
};
//# sourceMappingURL=validation.js.map