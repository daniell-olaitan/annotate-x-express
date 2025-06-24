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
exports.loadLoggedInUser = loadLoggedInUser;
exports.redirectLoggedInUser = redirectLoggedInUser;
exports.requireLogin = requireLogin;
const authServices_1 = __importDefault(require("../../services/authServices"));
const httpErrors_1 = require("./httpErrors");
function loadLoggedInUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.session.userId) {
            req.user = yield authServices_1.default.confirmUserId(req.session.userId);
        }
        next();
    });
}
function redirectLoggedInUser(req, res, next) {
    loadLoggedInUser(req, res, () => {
        if (req.user)
            return res.redirect('/');
        next();
    });
}
function requireLogin(req, res, next) {
    loadLoggedInUser(req, res, () => {
        if (!req.user)
            return next(new httpErrors_1.Unauthorized('User is not logged in'));
        next();
    });
}
