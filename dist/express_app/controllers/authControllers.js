"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authServices_1 = __importDefault(require("../../services/authServices"));
const httpErrors_1 = require("../core/httpErrors");
class AuthController {
    static demoSignin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let userId, projectId;
                if (req.session.userId && req.session.demo) {
                    projectId = yield authServices_1.default.fetchUserProjectId(req.session.userId);
                }
                else {
                    [userId, projectId] = yield authServices_1.default.createDemo();
                }
                req.session.userId = userId;
                req.session.demo = true;
                res.json({
                    status: 'success',
                    data: { id: projectId },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static signin(req, res) {
        res.render('index', {
            content: 'pages/signin',
            title: 'Sign In'
        });
    }
    static postSignin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            if (!username || !password) {
                return next(new httpErrors_1.BadRequest('Username and passwords are required'));
            }
            try {
                const userId = yield authServices_1.default.signInUser({ username, password });
                req.session.userId = userId;
            }
            catch (error) {
                return next(error);
            }
            res.redirect('/');
        });
    }
    static postSignup(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            if (!username || !password) {
                return next(new httpErrors_1.BadRequest('Username and passwords are required'));
            }
            try {
                yield authServices_1.default.signUpUser({ username, password });
            }
            catch (error) {
                return next(error);
            }
            res.redirect('/signin');
        });
    }
    static signup(req, res) {
        res.render('index', {
            content: 'pages/signup',
            title: 'Sign Up'
        });
    }
    static signout(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const demo = req.session.demo;
            const userId = req.session.userId;
            delete req.session.demo;
            delete req.session.userId;
            if (demo && userId) {
                try {
                    yield authServices_1.default.destroyDemoData(userId);
                }
                catch (error) {
                    return next(error);
                }
            }
            res.json({
                status: 'success',
                data: {}
            });
        });
    }
}
exports.default = AuthController;
