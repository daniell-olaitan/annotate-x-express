import express, { Router } from 'express';
import AuthController from '../controllers/authControllers';
import { requireLogin, redirectLoggedInUser } from '../core/middlewares';

const authRouter = Router();

authRouter.get('/demo-signin', AuthController.demoSignin);
authRouter.get('/signin', redirectLoggedInUser, AuthController.signin);
authRouter.post('/signin', express.json(), redirectLoggedInUser, AuthController.postSignin);
authRouter.get('/signup', redirectLoggedInUser, AuthController.signup);
authRouter.post('/signup', express.json(), redirectLoggedInUser, AuthController.postSignup);
authRouter.get('/signout', requireLogin, AuthController.signout);

export default authRouter;
