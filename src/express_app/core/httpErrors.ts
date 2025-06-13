export class BadRequest extends Error {
  statusCode: number;

  constructor(public message: string) {
    super(message);
    this.statusCode = 400;
  }
}

export class NotFound extends Error {
  statusCode: number;

  constructor(public message: string) {
    super(message);
    this.statusCode = 404;
  }
}

export class Unauthorized extends Error {
  statusCode: number;

  constructor(public message: string) {
    super(message);
    this.statusCode = 401;
  }
}

export class InternalServalError extends Error {
  statusCode: number;

  constructor(public message: string) {
    super(message);
    this.statusCode = 500;
  }
}
