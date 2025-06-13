import { NextFunction, Request, Response } from 'express';
import { AuthServices } from '../../services/authServices';
import { BadRequest, InternalServalError } from '../core/httpErrors';

class AuthController {
  static async demoSignin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let userId, projectId;

      if (req.session.userId && req.session.demo) {
        projectId = await AuthServices.fetchUserProjectId(req.session.userId);
      } else {
        [userId, projectId] = await AuthServices.createDemo();
      }

      req.session.userId = userId;
      req.session.demo = true;

      res.json({
        status: 'success',
        data: { id: projectId },
      })
    } catch (error) {
      next(error);
    }
  }

  static signin(req: Request, res: Response): void {
    res.render('index', {
      content: 'pages/signin',
      title: 'Sign In'
    });
  }

  static async postSignin(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      next(new BadRequest('Username and passwords are required'));
    }

    try {
      const userId = await AuthServices.signInUser({ username, password });
      req.session.userId = userId;
    } catch (error) {
      return next(error);
    }

    res.redirect('/');
  }

  static async postSignup(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(new BadRequest('Username and passwords are required'));
    }

    try {
      await AuthServices.signUpUser({ username, password });
    } catch (error) {
      return next(error);
    }

    res.redirect('/signin');
  }

  static signup(req: Request, res: Response): void {
    res.render('index', {
      content: 'pages/signup',
      title: 'Sign Up'
    });
  }

  static async signout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const demo = req.session.demo;
    const userId = req.session.userId;

    delete req.session.demo;
    delete req.session.userId;

    if (demo && userId) {
      try {
        await AuthServices.destroyDemoData(userId);
      } catch (error) {
        return next(error);
      }
    }

    res.json({
      status: 'success',
      data: {}
    });
  }
}

export default AuthController;
