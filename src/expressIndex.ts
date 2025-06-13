import dotenv from 'dotenv';
dotenv.config();

import { NextFunction, Request, Response } from 'express';
import createApp from "./express_app/config";

const app = createApp();

app.get('/', (req: Request, res: Response) => {
  if (!req.session.userId) return res.redirect('/signin');

  res.render('index', {
    content: 'pages/project',
    projectId: null,
    title: 'Project',
    username: 'test_user'
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  res.status(err.statusCode || 500).json({
    status: 'Failed',
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong!',
  });
});

app.listen(3000, () => {
  console.log(`My first Express app - listening on port ${3000}!`);
});
