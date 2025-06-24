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
exports.uow = exports.UnitOfWork = void 0;
const repo_1 = require("./repo");
const repo_2 = require("./repo");
class UnitOfWork {
    constructor(prisma) {
        this.prisma = prisma;
        this.userRepo = new repo_2.UserRepo(this.prisma);
        this.projectRepo = new repo_2.ProjectRepo(prisma);
        this.imageRepo = new repo_2.ImageRepo(prisma);
        this.demoRepo = new repo_2.DemoRepo(prisma);
        this.annotationRepo = new repo_2.AnnotationRepo(prisma);
        this.categoryRepo = new repo_2.CategoryRepo(prisma);
    }
    runInTransaction(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const ctx = {
                    userRepo: new repo_2.UserRepo(tx),
                    projectRepo: new repo_2.ProjectRepo(tx),
                    imageRepo: new repo_2.ImageRepo(tx),
                    demoRepo: new repo_2.DemoRepo(tx),
                    annotationRepo: new repo_2.AnnotationRepo(tx),
                    categoryRepo: new repo_2.CategoryRepo(tx)
                };
                return yield fn(ctx);
            }));
        });
    }
}
exports.UnitOfWork = UnitOfWork;
exports.uow = new UnitOfWork(repo_1.prisma);
