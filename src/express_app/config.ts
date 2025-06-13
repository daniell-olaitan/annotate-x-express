import express, { Application } from 'express';
import path from 'node:path';
import session from 'express-session';
import authRouter from './routes/authRouter';

export default function createApp(): Application {
  const app = express();

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  const assetsPath = path.join(__dirname, "public");
  app.use(express.static(assetsPath));

  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) throw new Error("SECRET_KEY environment variable is not defined");

  app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false
    }
  }));

  app.use(authRouter);
  return app;
}
