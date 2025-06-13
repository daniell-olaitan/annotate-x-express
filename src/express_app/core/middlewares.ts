import { Request, Response, NextFunction } from "express";
import { AppServices } from "../../services/appServices";
import { Unauthorized } from "./httpErrors";

export function loadLoggedInUser(req: Request, res: Response, next: NextFunction): void {
  if (req.session.userId) {
    req.user = AppServices.getUserById(req.session.userId);
  }

  next();
}

export function requireLogin(req: Request, res: Response, next: NextFunction): void {
  loadLoggedInUser(req, res, () => {
    if (!req.user) next(new Unauthorized('User is not logged in'));

    next();
  });
}
