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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../app/models");
const uow_1 = require("../storage/uow");
const bcrypt_1 = __importDefault(require("bcrypt"));
const utils_1 = require("../utils");
const uuid_1 = require("uuid");
const utils_2 = require("../utils");
const httpErrors_1 = require("../express_app/core/httpErrors");
const imageUtil = new utils_2.ImageUtil();
class AuthServices {
    static confirmUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _a = yield this.uow.userRepo.getById(userId), { createdAt } = _a, userData = __rest(_a, ["createdAt"]);
                return userData;
            }
            catch (_error) {
                return null;
            }
        });
    }
    static createDemo() {
        return __awaiter(this, void 0, void 0, function* () {
            const usernames = (yield this.uow.userRepo.list()).map(user => user.username);
            const username = (0, utils_1.generateUniqueName)(usernames, 'demo');
            const saltRounds = 10;
            let password;
            try {
                password = yield bcrypt_1.default.hash('demo', saltRounds);
            }
            catch (error) {
                throw new httpErrors_1.InternalServalError('Something went wrong');
            }
            const user = new models_1.User(username, password, (0, uuid_1.v4)());
            // Fetch and upload demo images
            const demoImageUrls = (yield this.uow.demoRepo.getDemos()).map(demo => demo.url);
            let imageFiles;
            try {
                imageFiles = yield imageUtil.fetchImages(demoImageUrls);
            }
            catch (error) {
                throw new httpErrors_1.InternalServalError('Network Error');
            }
            const files = [];
            const imageNames = [];
            imageFiles.forEach(img => {
                const imageName = (0, utils_1.generateUniqueName)(imageNames, 'image');
                imageNames.push(imageName);
                files.push([imageName, img.data]);
            });
            const projectName = (0, utils_1.generateUniqueName)([], 'project').toUpperCase();
            let uploadedImages;
            try {
                uploadedImages = yield imageUtil.uploadImages(files, `EXPRESS/${projectName}`);
            }
            catch (error) {
                throw new httpErrors_1.InternalServalError('Network Error');
            }
            return this.uow.runInTransaction((_a) => __awaiter(this, [_a], void 0, function* ({ userRepo, categoryRepo, projectRepo, imageRepo }) {
                // Create a demo user
                const _userData = yield userRepo.create(Object.assign({}, user));
                // Create and save default project
                const project = new models_1.Project(projectName, (0, uuid_1.v4)());
                const _projectData = yield projectRepo.create(Object.assign(Object.assign({}, project), { userId: user.id }));
                // Create and save default categories
                const categoryData = [
                    ['car', 'purple'],
                    ['bus', 'brown'],
                    ['van', 'blue']
                ];
                const categories = categoryData.map(c => new models_1.Category(c[0], c[1], (0, uuid_1.v4)()));
                const _categoriesData = yield categoryRepo.createMany(categories.map(c => (Object.assign(Object.assign({}, c), { projectId: project.id }))));
                const images = uploadedImages.map(img => new models_1.Image(img.url, img.width, img.height, img.filename, (0, uuid_1.v4)()));
                // Save demo images
                const _imagesData = yield imageRepo.createMany(images.map(img => (Object.assign(Object.assign({}, img), { projectId: project.id }))));
                return [user.id, project.id];
            }));
        });
    }
    static signInUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.uow.userRepo.getByUsername(userData.username);
            let status;
            try {
                status = yield bcrypt_1.default.compare(userData.password, user.password);
            }
            catch (error) {
                throw new httpErrors_1.InternalServalError('Something went wrong');
            }
            if (status) {
                return user.id;
            }
            else {
                throw new httpErrors_1.BadRequest('Incorrect password');
            }
        });
    }
    static signUpUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _user = yield this.uow.userRepo.getByUsername(userData.username);
            }
            catch (error) {
                const saltRounds = 10;
                let password;
                try {
                    password = yield bcrypt_1.default.hash(userData.password, saltRounds);
                }
                catch (error) {
                    throw new httpErrors_1.InternalServalError('Something went wrong');
                }
                const user = new models_1.User(userData.username, password, (0, uuid_1.v4)());
                const _user = yield this.uow.userRepo.create(Object.assign({}, user));
                return;
            }
            throw new httpErrors_1.BadRequest('Username already exist');
        });
    }
    static fetchUserProjectId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.uow.projectRepo.list(userId))[0].id;
        });
    }
    static destroyDemoData(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.uow.runInTransaction((_a) => __awaiter(this, [_a], void 0, function* ({ projectRepo, userRepo }) {
                for (const project of yield projectRepo.list(userId)) {
                    try {
                        imageUtil.deleteAll(project.name);
                    }
                    catch (_b) {
                        throw new httpErrors_1.InternalServalError('Network Error');
                    }
                }
                yield userRepo.remove(userId);
            }));
        });
    }
}
AuthServices.uow = uow_1.uow;
exports.default = AuthServices;
