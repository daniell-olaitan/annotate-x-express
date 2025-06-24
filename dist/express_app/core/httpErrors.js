"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServalError = exports.Unauthorized = exports.NotFound = exports.BadRequest = void 0;
class BadRequest extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.statusCode = 400;
    }
}
exports.BadRequest = BadRequest;
class NotFound extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.statusCode = 404;
    }
}
exports.NotFound = NotFound;
class Unauthorized extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.statusCode = 401;
    }
}
exports.Unauthorized = Unauthorized;
class InternalServalError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.statusCode = 500;
    }
}
exports.InternalServalError = InternalServalError;
