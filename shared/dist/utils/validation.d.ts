import type { ValidationError } from '../types/index.js';
export declare class ValidationResult {
    private errors;
    addError(field: string, message: string, code: string): void;
    get isValid(): boolean;
    get validationErrors(): ValidationError[];
    getFirstError(field?: string): ValidationError | undefined;
}
export declare const validateEmail: (email: string) => boolean;
export declare const validateUsername: (username: string) => ValidationResult;
export declare const validatePassword: (password: string) => ValidationResult;
export declare const validateRoomName: (name: string) => ValidationResult;
export declare const validateMessageContent: (content: string) => ValidationResult;
//# sourceMappingURL=validation.d.ts.map