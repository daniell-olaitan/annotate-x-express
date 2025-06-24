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
const httpErrors_1 = require("../express_app/core/httpErrors");
const uuid_1 = require("uuid");
const utils_1 = require("../utils");
const archiver_1 = __importDefault(require("archiver"));
const stream_1 = require("stream");
const uow_1 = require("../storage/uow");
const imageUtil = new utils_1.ImageUtil();
class AppServices {
    static confirmProject(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.uow.projectRepo.getById(id);
                return true;
            }
            catch (_error) {
                return false;
            }
        });
    }
    static createNewProject(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const projectName = data.name.toUpperCase();
            try {
                yield this.uow.projectRepo.getByName(projectName);
                throw new httpErrors_1.BadRequest('Project name already exist');
            }
            catch (error) {
                if (!(error instanceof httpErrors_1.NotFound))
                    throw error;
            }
            // Prepare image names & buffers
            const files = [];
            const imageNames = [];
            data.files.forEach(img => {
                const imageName = (0, utils_1.generateUniqueName)(imageNames, 'image');
                imageNames.push(imageName);
                files.push([imageName, img]);
            });
            // Upload images
            let uploadedImages;
            try {
                uploadedImages = yield imageUtil.uploadImages(files, `EXPRESS/${projectName}`);
            }
            catch (error) {
                throw new httpErrors_1.InternalServalError('Network Error');
            }
            return this.uow.runInTransaction((_a) => __awaiter(this, [_a], void 0, function* ({ projectRepo, categoryRepo, imageRepo }) {
                // Create and save new project
                const project = new models_1.Project(projectName, (0, uuid_1.v4)());
                const projectData = yield projectRepo.create(Object.assign(Object.assign({}, project), { userId }));
                // Create and save new categories for the project
                const categories = data.categories.map(c => new models_1.Category(c[0], c[1], (0, uuid_1.v4)()));
                yield categoryRepo.createMany(categories.map(c => (Object.assign(Object.assign({}, c), { projectId: project.id }))));
                // Save uploaded images
                const images = uploadedImages.map(img => new models_1.Image(img.url, img.width, img.height, img.filename, (0, uuid_1.v4)()));
                yield imageRepo.createMany(images.map(img => (Object.assign(Object.assign({}, img), { projectId: project.id }))));
                return projectData;
            }));
        });
    }
    static getProject(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.uow.projectRepo.getWithRelationships(id);
        });
    }
    static getUserProjects(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.uow.projectRepo.list(userId);
        });
    }
    static deleteProject(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.uow.projectRepo.remove(id);
        });
    }
    static createNewAnnotations(pId, iId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate ids
            yield this.uow.imageRepo.getById(iId);
            yield this.uow.projectRepo.getById(pId);
            return this.uow.runInTransaction((_a) => __awaiter(this, [_a], void 0, function* ({ annotationRepo, categoryRepo }) {
                // Remove the existing annotations to be replaced with newly created ones
                yield annotationRepo.removeImageAnnotations(iId);
                //Create new annotations and categories
                yield Promise.all(data.map((annotation) => __awaiter(this, void 0, void 0, function* () {
                    const annotatn = new models_1.Annotation(annotation.x, annotation.y, annotation.height, annotation.width, (0, uuid_1.v4)());
                    let categoryId;
                    try {
                        const categoryData = yield categoryRepo.getByName(annotation.category.name);
                        categoryId = categoryData.id;
                    }
                    catch (_error) {
                        const category = new models_1.Category(annotation.category.name, annotation.category.color, (0, uuid_1.v4)());
                        const categoryData = yield categoryRepo.create(Object.assign(Object.assign({}, category), { projectId: pId }));
                        categoryId = categoryData.id;
                    }
                    yield annotationRepo.create(Object.assign(Object.assign({}, annotatn), { imageId: iId, categoryId }));
                })));
            }));
        });
    }
    static addImagesToAProject(projectId, imageFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = yield this.uow.projectRepo.getById(projectId);
            // Upload and save images
            const files = [];
            const projectImages = yield this.uow.imageRepo.getProjectImages(projectId);
            const imageNames = projectImages.map(img => img.filename);
            imageFiles.forEach(img => {
                const imageName = (0, utils_1.generateUniqueName)(imageNames, 'image');
                imageNames.push(imageName);
                files.push([imageName, img]);
            });
            let uploadedImages;
            try {
                uploadedImages = yield imageUtil.uploadImages(files, `EXPRESS/${project.name}`);
            }
            catch (error) {
                throw new httpErrors_1.InternalServalError('Network Error');
            }
            const images = uploadedImages.map(img => new models_1.Image(img.url, img.width, img.height, img.filename, (0, uuid_1.v4)()));
            const imagesData = yield this.uow.imageRepo.createMany(images.map(img => (Object.assign(Object.assign({}, img), { projectId: project.id }))));
            return imagesData.map(imageData => (Object.assign(Object.assign({}, imageData), { annotations: [] })));
        });
    }
    static deleteImage(imageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const img = yield this.uow.imageRepo.getById(imageId);
            try {
                const image = new models_1.Image(img.url, img.width, img.height, img.filename, (0, uuid_1.v4)());
                yield imageUtil.deleteImage(image);
            }
            catch (error) {
                throw new httpErrors_1.InternalServalError('Network Error');
            }
            yield this.uow.imageRepo.remove(imageId);
        });
    }
    static zipProject(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = yield this.uow.projectRepo.getWithRelationships(projectId);
            const projectName = project.name.toLowerCase();
            const imageUrls = [];
            const annotations = [];
            const categories = project.categories.map((c) => ({ id: c.id, name: c.name }));
            const images = project.images.map((img) => {
                const { id, url, width, height, filename } = img, _ = __rest(img, ["id", "url", "width", "height", "filename"]);
                img.annotations.forEach((a) => {
                    annotations.push({
                        id: a.id,
                        imageId: a.imageId,
                        categoryId: a.categoryId,
                        iscrowd: 0,
                        area: a.width * a.height,
                        bbox: [a.x, a.y, a.height, a.width]
                    });
                });
                imageUrls.push(url);
                return { id, width, height, filename };
            });
            let responses;
            try {
                responses = yield imageUtil.fetchImages(imageUrls);
            }
            catch (error) {
                throw new httpErrors_1.InternalServalError('Network Error');
            }
            const zipStream = new stream_1.PassThrough();
            const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
            archive.pipe(zipStream);
            // Add images
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                const response = responses[i];
                archive.append(response.data, { name: `images/${img.filename}` });
            }
            // Add project metadata
            const projectStr = JSON.stringify({
                images,
                categories,
                annotations
            }, null, 2);
            archive.append(projectStr, { name: 'annotations.json' });
            // Finalize the archive
            archive.finalize();
            return [projectName, zipStream];
        });
    }
}
AppServices.uow = uow_1.uow;
exports.default = AppServices;
