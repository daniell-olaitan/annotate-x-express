import { Prisma, PrismaClient } from "@prisma/client";
import { InternalServalError, NotFound } from "../express_app/core/errorHandlers";
import { User, Project, Annotation, Demo, Category, Image } from "@prisma/client";
import { IUserProps, IAnnotationProps, ICategoryProps, IImageProps, IProjectProps } from "../app/models";

export const prisma = new PrismaClient();

// Abstract Repositories
interface IBase<TCreate, TReturn, TInput = TCreate> {
  create(data: TInput): Promise<TReturn>;
}

type AnnotationInput = IAnnotationProps & { imageId: string, categoryId: string };

interface IAnnotation extends IBase<IAnnotationProps, Annotation, IAnnotationProps> {
  removeImageAnnotations(imageId: string): Promise<void>;
}

interface IRepo<TCreate, TReturn, TInput = TCreate> extends IBase<TCreate, TReturn, TInput> {
  getById(id: string): Promise<TReturn>;
  remove(id: string): Promise<void>;
}

interface IUser extends IRepo<IUserProps, User> {
  getByUsername(username: string): Promise<User>;
  list(): Promise<User[]>;
}

type ProjectInput = IProjectProps & { userId: string };

interface IProject extends IRepo<IProjectProps, Project, ProjectInput> {
  getByName(name: string): Promise<Project>;
  list(userId?: string): Promise<Project[]>;
  getWithRelationships(id: string): Promise<Project>;
}

type CategoryInput = ICategoryProps & { projectId: string };

interface ICategory extends IBase<ICategoryProps, Category, CategoryInput> {
  getByName(name: string): Promise<Category>;
}

type ImageInput = IImageProps & { projectId: string };

interface IImage extends IRepo<IImageProps, Image, ImageInput> {
  getProjectImages(projectId: string): Promise<Image[]>;
}

interface IDemo {
  getDemos(): Promise<Demo[]>;
}

abstract class BaseRepo<TCreate, TReturn, TInput = TCreate> {
  protected abstract model: string;

  constructor(protected prisma: any) { } // accepts PrismaClient or Prisma.TransactionClient

  async create(data: TInput): Promise<TReturn> {
    try {
      return await this.prisma[this.model].create({ data });
    } catch (err) {
      console.error(err);
      throw new InternalServalError("something went wrong");
    }
  }
}

abstract class Repo<TCreate, TReturn, TInput = TCreate> extends BaseRepo<TCreate, TReturn, TInput> {
  async getById(id: string): Promise<TReturn> {
    try {
      return await this.prisma[this.model].findUniqueOrThrow({ where: { id } });
    } catch (err) {
      console.error(err);
      throw new NotFound(`${this.model} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma[this.model].delete({ where: { id } });
    } catch (err) {
      console.error(err);
      throw new NotFound(`${this.model} not found`);
    }
  }
}

// Implementations of the Model Repositories
export class UserRepo extends Repo<IUserProps, User> implements IUser {
  protected model = "user";

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    super(prisma);
  }

  async getByUsername(username: string): Promise<User> {
    try {
      return await this.prisma.user.findUniqueOrThrow({
        where: { username: username }
      });
    } catch (err) {
      console.error(err);
      throw new NotFound('user not found');
    }
  }

  async list(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany();
    } catch (err) {
      console.error(err);
      throw new InternalServalError('something went wrong');
    }
  }
}

export class ProjectRepo extends Repo<IProjectProps, Project, ProjectInput> implements IProject {
  protected model = "project";

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    super(prisma);
  }

  async getByName(name: string): Promise<Project> {
    try {
      return await this.prisma.project.findUniqueOrThrow({
        where: { name: name }
      });
    } catch (err) {
      console.error(err);
      throw new NotFound('project not found');
    }
  }

  async getWithRelationships(id: string): Promise<Project> {
    try {
      return await this.prisma.project.findUniqueOrThrow({
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
    } catch (err) {
      console.log(err);
      throw new NotFound('project not found');
    }
  }

  async list(userId?: string): Promise<Project[]> {
    try {
      if (userId) {
        return await this.prisma.project.findMany({
          where: { userId: userId }
        });
      } else {
        return await this.prisma.project.findMany();
      }
    } catch (err) {
      console.error(err);
      throw new InternalServalError('something went wrong');
    }
  }
}

export class ImageRepo extends Repo<IImageProps, Image, ImageInput> implements IImage {
  protected model = "image";

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    super(prisma);
  }

  async getProjectImages(projectId: string): Promise<Image[]> {
    try {
      return await this.prisma.image.findMany({
        where: { projectId: projectId }
      });
    } catch (err) {
      console.error(err);
      throw new InternalServalError('something went wrong');
    }
  }
}

export class AnnotationRepo extends BaseRepo<IAnnotationProps, Annotation, AnnotationInput> implements IAnnotation {
  protected model = "annotation";

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    super(prisma);
  }

  async removeImageAnnotations(imageId: string): Promise<void> {
    try {
      const _ = await this.prisma.annotation.deleteMany({
        where: {
          imageId: imageId
        }
      });
    } catch (err) {
      console.error(err);
      throw new InternalServalError('something went wrong');
    }
  }
}

export class CategoryRepo extends BaseRepo<ICategoryProps, Category, CategoryInput> implements ICategory {
  protected model = "category";

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    super(prisma);
  }

  async getByName(name: string): Promise<Category> {
    try {
      return await this.prisma.category.findFirstOrThrow({
        where: {
          name: name
        }
      });
    } catch (err) {
      console.error(err);
      throw new NotFound('category not found');
    }
  }
}

export class DemoRepo implements IDemo {
  constructor(private prisma: PrismaClient | Prisma.TransactionClient) { }

  async getDemos(): Promise<Demo[]> {
    try {
      return await this.prisma.demo.findMany();
    } catch (err) {
      console.log(err);
      throw new InternalServalError('Something Went Wrong');
    }
  }
}
