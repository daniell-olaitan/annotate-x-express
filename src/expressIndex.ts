import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import createApp from "./express_app/config";
import AppController from './express_app/controllers/appControllers';
import { loadLoggedInUser, requireLogin } from './express_app/core/middlewares';
import { Request, Response, NextFunction } from 'express';
import upload from './express_app/multerConfig';

const app = createApp();

app.get('/', loadLoggedInUser, AppController.index);
app.get('/project/:id', loadLoggedInUser, AppController.displayProject);
app.post('/projects', requireLogin, upload.array('files'), AppController.createProject);
app.get('/projects/:id', requireLogin, AppController.readProject);
app.get('/projects', requireLogin, AppController.listProjects);
app.delete('/projects/:id', requireLogin, AppController.deleteProject);
app.post('/projects/:pId/images/:iId/annotations', requireLogin, express.json(), AppController.createAnnotations);
app.post('/projects/:id/images', requireLogin, upload.array('files'), AppController.addProjectImages);
app.delete('/images/:id', requireLogin, AppController.deleteImage);
app.get('/export/:id', requireLogin, AppController.exportProject);

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
