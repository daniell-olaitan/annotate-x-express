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
const appServices_1 = __importDefault(require("../../services/appServices"));
const httpErrors_1 = require("../core/httpErrors");
const validationSchemas_1 = require("../core/validationSchemas");
const zod_1 = require("zod");
class AppController {
    static index(req, res) {
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
    static displayProject(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                return res.redirect('/signin');
            }
            if (yield appServices_1.default.confirmProject(req.params.id)) {
                res.render('index', {
                    content: 'pages/project',
                    projectId: req.params.id,
                    title: 'Project',
                    username: req.user.username
                });
            }
            else {
                next(new httpErrors_1.BadRequest('Invalid Project Id'));
            }
        });
    }
    static createProject(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, classes } = req.body;
            const categories = Object.entries(JSON.parse(classes));
            const fileUpload = req.files;
            if (!name || !classes) {
                return next(new httpErrors_1.BadRequest('Project name and categories are required'));
            }
            try {
                const files = fileUpload.map(file => file.buffer);
                const projectData = yield appServices_1.default.createNewProject(req.user.id, { name, categories, files });
                return res.status(201).json({
                    status: 'success',
                    data: projectData
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static readProject(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const projectData = yield appServices_1.default.getProject(req.params.id);
                return res.json({
                    status: 'success',
                    data: projectData
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static listProjects(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const projectData = yield appServices_1.default.getUserProjects(req.user.id);
                return res.json({
                    status: 'success',
                    data: projectData
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static deleteProject(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield appServices_1.default.deleteProject(req.params.id);
                return res.json({
                    status: 'success',
                    data: {}
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static createAnnotations(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = validationSchemas_1.AnnotationsPayloadSchema.parse(req.body);
                yield appServices_1.default.createNewAnnotations(req.params.pId, req.params.iId, data);
                return res.json({
                    status: 'success',
                    data: {}
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    return next(new httpErrors_1.BadRequest(`Invalid user input: ${error.errors}`));
                }
                next(error);
            }
        });
    }
    static addProjectImages(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileUpload = req.files;
            try {
                const files = fileUpload.map(file => file.buffer);
                const imageData = yield appServices_1.default.addImagesToAProject(req.params.id, files);
                return res.status(201).json({
                    status: 'success',
                    data: imageData
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static deleteImage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield appServices_1.default.deleteImage(req.params.id);
                return res.json({
                    status: 'success',
                    data: {}
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    static exportProject(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [projectName, zipStream] = yield appServices_1.default.zipProject(req.params.id);
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', `attachment; filename="${projectName}_annotations.zip"`);
                return zipStream.pipe(res);
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = AppController;
