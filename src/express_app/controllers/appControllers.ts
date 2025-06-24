import { Response, Request, NextFunction } from "express";
import AppServices from "../../services/appServices";
import { BadRequest } from "../core/httpErrors";
import { AnnotationsPayloadSchema } from "../core/validationSchemas";
import { z } from "zod";

export default class AppController {
  static index(req: Request, res: Response): void {
    if (!req.user) {
      return res.redirect('/signin');
    }

    res.render('index', {
      content: 'pages/project',
      projectId: null,
      title: 'Project',
      username: req.user.username
    });
  }

  static async displayProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      return res.redirect('/signin');
    }

    if (await AppServices.confirmProject(req.params.id)) {
      res.render('index', {
        content: 'pages/project',
        projectId: req.params.id,
        title: 'Project',
        username: req.user.username
      });
    } else {
      next(new BadRequest('Invalid Project Id'));
    }
  }

  static async createProject(req: Request, res: Response, next: NextFunction): Promise<any> {
    const { name, classes } = req.body;
    const categories: [string, string][] = Object.entries(JSON.parse(classes));
    const fileUpload = req.files as Express.Multer.File[];

    if (!name || !classes) {
      return next(new BadRequest('Project name and categories are required'));
    }

    try {
      const files: Buffer[] = fileUpload.map(file => file.buffer);
      const projectData = await AppServices.createNewProject(
        req.user.id, { name, categories, files }
      );

      return res.status(201).json({
        status: 'success',
        data: projectData
      });
    } catch (error) {
      next(error);
    }
  }

  static async readProject(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const projectData = await AppServices.getProject(req.params.id);

      return res.json({
        status: 'success',
        data: projectData
      });
    } catch (error) {
      next(error);
    }
  }

  static async listProjects(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const projectData = await AppServices.getUserProjects(req.user.id);

      return res.json({
        status: 'success',
        data: projectData
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await AppServices.deleteProject(req.params.id);

      return res.json({
        status: 'success',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  static async createAnnotations(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const data = AnnotationsPayloadSchema.parse(req.body);

      await AppServices.createNewAnnotations(req.params.pId, req.params.iId, data);

      return res.json({
        status: 'success',
        data: {}
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new BadRequest(`Invalid user input: ${error.errors}`));
      }

      next(error);
    }
  }

  static async addProjectImages(req: Request, res: Response, next: NextFunction): Promise<any> {
    const fileUpload = req.files as Express.Multer.File[];

    try {
      const files: Buffer[] = fileUpload.map(file => file.buffer);

      const imageData = await AppServices.addImagesToAProject(req.params.id, files);

      return res.status(201).json({
        status: 'success',
        data: imageData
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteImage(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await AppServices.deleteImage(req.params.id);

      return res.json({
        status: 'success',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportProject(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const [projectName, zipStream] = await AppServices.zipProject(req.params.id);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${projectName}_annotations.zip"`
      );

      return zipStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}
