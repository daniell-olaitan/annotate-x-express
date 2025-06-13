import 'express';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    demo?: boolean;
  }
}

declare module 'express' {
  interface Request {
    user?: any;
  }
}
