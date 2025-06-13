import { PrismaClient } from '@prisma/client';
import { prisma } from './repo';
import { UserRepo, CategoryRepo, ProjectRepo, AnnotationRepo, ImageRepo, DemoRepo } from './repo';

export interface RepoContext {
  userRepo?: UserRepo;
  categoryRepo?: CategoryRepo;
  projectRepo?: ProjectRepo;
  annotationRepo?: AnnotationRepo;
  imageRepo?: ImageRepo;
  demoRepo?: DemoRepo;
}

interface AbstractUnitOfWork {
  userRepo: UserRepo;
  categoryRepo: CategoryRepo;
  projectRepo: ProjectRepo;
  annotationRepo: AnnotationRepo;
  imageRepo: ImageRepo;
  demoRepo: DemoRepo;

  runInTransaction<T>(fn: (ctx: RepoContext) => Promise<T>): Promise<T>;
}

export class UnitOfWork implements AbstractUnitOfWork {
  userRepo: UserRepo;
  projectRepo: ProjectRepo;
  imageRepo: ImageRepo;
  demoRepo: DemoRepo;
  annotationRepo: AnnotationRepo;
  categoryRepo: CategoryRepo;

  constructor(private prisma: PrismaClient) {
    this.userRepo = new UserRepo(this.prisma);
    this.projectRepo = new ProjectRepo(prisma);
    this.imageRepo = new ImageRepo(prisma);
    this.demoRepo = new DemoRepo(prisma);
    this.annotationRepo = new AnnotationRepo(prisma);
    this.categoryRepo = new CategoryRepo(prisma);
  }

  async runInTransaction<T>(fn: (ctx: RepoContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const ctx: RepoContext = {
        userRepo: new UserRepo(tx),
        projectRepo: new ProjectRepo(tx),
        imageRepo: new ImageRepo(tx),
        demoRepo: new DemoRepo(tx),
        annotationRepo: new AnnotationRepo(tx),
        categoryRepo: new CategoryRepo(tx)
      }

      return await fn(ctx);
    });
  }
}

export const uow = new UnitOfWork(prisma);
