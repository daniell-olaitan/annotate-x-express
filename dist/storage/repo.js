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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoRepo = exports.CategoryRepo = exports.AnnotationRepo = exports.ImageRepo = exports.ProjectRepo = exports.UserRepo = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const httpErrors_1 = require("../express_app/core/httpErrors");
exports.prisma = new client_1.PrismaClient();
class BaseRepo {
    constructor(prisma) {
        this.prisma = prisma;
    } // accepts PrismaClient or Prisma.TransactionClient
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma[this.model].create({ data });
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.InternalServalError("something went wrong");
            }
        });
    }
}
class Repo extends BaseRepo {
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma[this.model].findUniqueOrThrow({ where: { id } });
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.NotFound(`${this.model} not found`);
            }
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma[this.model].delete({ where: { id } });
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.NotFound(`${this.model} not found`);
            }
        });
    }
}
// Implementations of the Model Repositories
class UserRepo extends Repo {
    constructor(prisma) {
        super(prisma);
        this.model = "user";
    }
    getByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.user.findUniqueOrThrow({
                    where: { username: username }
                });
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.NotFound('User does not exist');
            }
        });
    }
    list() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.user.findMany();
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.InternalServalError('something went wrong');
            }
        });
    }
}
exports.UserRepo = UserRepo;
class ProjectRepo extends Repo {
    constructor(prisma) {
        super(prisma);
        this.model = "project";
    }
    getByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(name);
            try {
                return yield this.prisma.project.findUniqueOrThrow({
                    where: { name: name }
                });
            }
            catch (err) {
                // console.error(err);
                throw new httpErrors_1.NotFound('project not found');
            }
        });
    }
    getWithRelationships(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.project.findUniqueOrThrow({
                    where: { id: id },
                    include: {
                        categories: true,
                        images: {
                            include: {
                                annotations: {
                                    include: {
                                        category: true
                                    }
                                }
                            }
                        }
                    }
                });
            }
            catch (err) {
                console.log(err);
                throw new httpErrors_1.NotFound('project not found');
            }
        });
    }
    list(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (userId) {
                    return yield this.prisma.project.findMany({
                        where: { userId: userId }
                    });
                }
                else {
                    return yield this.prisma.project.findMany();
                }
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.InternalServalError('something went wrong');
            }
        });
    }
}
exports.ProjectRepo = ProjectRepo;
class ImageRepo extends Repo {
    constructor(prisma) {
        super(prisma);
        this.model = "image";
    }
    createMany(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Promise.all(data.map(image => this.prisma.image.create({ data: image })));
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.InternalServalError("something went wrong");
            }
        });
    }
    getProjectImages(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.image.findMany({
                    where: { projectId: projectId }
                });
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.InternalServalError('something went wrong');
            }
        });
    }
}
exports.ImageRepo = ImageRepo;
class AnnotationRepo extends BaseRepo {
    constructor(prisma) {
        super(prisma);
        this.model = "annotation";
    }
    removeImageAnnotations(imageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _ = yield this.prisma.annotation.deleteMany({
                    where: {
                        imageId: imageId
                    }
                });
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.InternalServalError('something went wrong');
            }
        });
    }
}
exports.AnnotationRepo = AnnotationRepo;
class CategoryRepo extends BaseRepo {
    constructor(prisma) {
        super(prisma);
        this.model = "category";
    }
    createMany(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Promise.all(data.map(category => this.prisma.category.create({ data: category })));
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.InternalServalError("something went wrong");
            }
        });
    }
    getByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.category.findFirstOrThrow({
                    where: {
                        name: name
                    }
                });
            }
            catch (err) {
                console.error(err);
                throw new httpErrors_1.NotFound('category not found');
            }
        });
    }
}
exports.CategoryRepo = CategoryRepo;
class DemoRepo {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getDemos() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.prisma.demo.findMany();
            }
            catch (err) {
                console.log(err);
                throw new httpErrors_1.InternalServalError('Something Went Wrong');
            }
        });
    }
}
exports.DemoRepo = DemoRepo;
