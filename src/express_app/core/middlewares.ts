import { Request, Response, NextFunction } from "express";
import AuthServices from "../../services/authServices";
import { Unauthorized } from "./httpErrors";

export async function loadLoggedInUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.session.userId) {
    req.user = await AuthServices.confirmUserId(req.session.userId);
  }

  next();
}

export function redirectLoggedInUser(req: Request, res: Response, next: NextFunction): void {
  loadLoggedInUser(req, res, () => {
    if (req.user) return res.redirect('/');

    next();
  });
}

export function requireLogin(req: Request, res: Response, next: NextFunction): void {
  loadLoggedInUser(req, res, () => {
    if (!req.user) return next(new Unauthorized('User is not logged in'));

    next();
  });
}
