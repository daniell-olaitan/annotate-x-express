import { User } from "../app/models";
import { uow } from "../storage/uow";


// // Implementations of the Model Repositories
// export class UserRepo implements IUser {
//   constructor(private prisma: PrismaClient | Prisma.TransactionClient) { }

//   async create(data: Prisma.UserCreateInput): Promise<User> {
//     const saltRounds = 10;
//     data.password = await bcrypt.hash(data.password, saltRounds);

//     const user = await this.prisma.user.create({
//       data: data
//     })

//     return user.id;
//   }

//   async get(username: string): Promise<User | null> {
//     const user = await this.prisma.user.findUnique({
//       where: { username: username }
//     });

//     if (user) {
//       return new User(user.username, user.password, user.id);
//     } else {
//       return user;
//     }
//   }

//   async getById(id: string): Promise<User | null> {
//     const user = await this.prisma.user.findUnique({
//       where: { id: id }
//     });

//     if (user) {
//       return new User(user.username, user.password, user.id);
//     } else {
//       return user;
//     }
//   }

//   async remove(id: string): Promise<void> {
//     const user = await this.prisma.user.delete({
//       where: { id: id }
//     });
//   }

//   async getUsernames(): Promise<string[]> {
//     const users = await this.prisma.user.findMany({
//       select: { username: true }
//     });

//     return users.map(user => user.username);
//   }
// }

// export class ProjectRepo implements IProject {
//   constructor(private prisma: PrismaClient | Prisma.TransactionClient) { }

//   async create(data: Prisma.ProjectCreateInput): Promise<string> {
//     const project = await this.prisma.project.create({
//       data: data
//     });

//     return project.id;
//   }

//   async get(name: string): Promise<Project | null> {
//     const project = await this.prisma.project.findUnique({
//       where: { name: name }
//     });

//     if (project) {
//       return new Project(project.name, project.id);
//     } else {
//       return project;
//     }
//   }

//   async getById(id: string): Promise<Project | null> {
//     const project = await this.prisma.project.findUnique({
//       where: { id: id }
//     });

//     if (project) {
//       return new Project(project.name, project.id);
//     } else {
//       return project;
//     }
//   }

//   async getWithRelationships(id: string): Promise<Project | {}> {
//     const project = await this.prisma.project.findUnique({
//       where: { id: id },
//       include: {
//         categories: true,
//         images: {
//           include: {
//             annotations: {
//               include: {
//                 category: true
//               }
//             }
//           }
//         }
//       }
//     });

//     if (project) {
//       const proj = new Project(project.name, project.id);
//       const categories = project.categories.map(c => new Category(c.name, c.color, c.id));
//       const images = project.images.map(img => {
//         const image = new Image(img.url, img.width, img.height, img.filename, img.id);

//         const annotations = img.annotations.map(a => {
//           const annotation = new Annotation(a.x, a.y, a.height, a.width, a.id);

//           annotation.category = new Category(a.category.name, a.category.color, a.category.id);
//           return annotation;
//         });

//         image.annotations = annotations;
//         return image;
//       });

//       proj.images = images;
//       proj.categories = categories;

//       return proj;
//     } else {
//       return {};
//     }
//   }

//   async list(userId?: string): Promise<Project[]> {
//     let project;

//     if (userId) {
//       project = await this.prisma.project.findMany({
//         where: { userId: userId }
//       });
//     } else {
//       project = await this.prisma.project.findMany();
//     }

//     return project.map(proj => new Project(proj.name, proj.id));
//   }

//   async remove(id: string): Promise<void> {
//     const _ = await this.prisma.project.delete({
//       where: { id: id }
//     });
//   }

//   async exportProjectData(id: string): Promise<Record<string, any> | {}> {
//     const project = await this.prisma.project.findUnique({
//       where: { id: id },
//       include: {
//         categories: true,
//         images: {
//           include: {
//             annotations: {
//               include: {
//                 category: true
//               }
//             }
//           }
//         }
//       }
//     });

//     if (project) {
//       const imageUrls: string[] = [];
//       const annotations: Record<string, any>[] = [];

//       const categories = project.categories.map(c => ({ id: c.id, name: c.name }));
//       const images = project.images.map(img => {
//         const { url, ...image } = img;
//         img.annotations.forEach(a => {
//           annotations.push({
//             id: a.id,
//             imageId: a.imageId,
//             categoryId: a.categoryId,
//             iscrowd: 0,
//             area: a.width * a.height,
//             bbox: [a.x, a.y, a.height, a.width]
//           });
//         });

//         imageUrls.push(url);
//         return image;
//       });

//       return {
//         name: project.name.toLocaleLowerCase(),
//         images,
//         imageUrls,
//         categories,
//         annotations
//       };
//     } else {
//       return {};
//     }
//   }
// }

// export class ImageRepo implements IImage {
//   constructor(private prisma: PrismaClient | Prisma.TransactionClient) { }

//   async create(data: Prisma.ImageCreateInput): Promise<string> {
//     const image = await this.prisma.image.create({
//       data: data
//     });

//     return image.id;
//   }

//   async getById(id: string): Promise<Image | null> {
//     const image = await this.prisma.image.findUnique({
//       where: {
//         id: id
//       }
//     });

//     if (image) {
//       return new Image(image.url, image.width, image.height, image.filename, image.id);
//     } else {
//       return image;
//     }
//   }

//   async getProjectImageNames(projectId: string): Promise<string[]> {
//     const images = await this.prisma.image.findMany({
//       where: { projectId: projectId }
//     });

//     return images.map(img => path.parse(img.url).name);
//   }

//   async remove(id: string): Promise<void> {
//     const _ = await this.prisma.image.delete({
//       where: {
//         id: id
//       }
//     });
//   }
// }

// export class AnnotationRepo implements IAnnotation {
//   constructor(private prisma: PrismaClient | Prisma.TransactionClient) { }

//   async create(data: Prisma.AnnotationCreateInput): Promise<string> {
//     const annotation = await this.prisma.annotation.create({
//       data: data
//     });

//     return annotation.id;
//   }

//   async removeImageAnnotations(imageId: string): Promise<void> {
//     const _ = await this.prisma.annotation.deleteMany({
//       where: {
//         imageId: imageId
//       }
//     });
//   }
// }

// export class CategoryRepo implements ICategory {
//   constructor(private prisma: PrismaClient | Prisma.TransactionClient) { }

//   async create(data: Prisma.CategoryCreateInput): Promise<string> {
//     const category = await this.prisma.category.create({
//       data: data
//     });

//     return category.id;
//   }

//   async get(name: string): Promise<Category | null> {
//     const category = await this.prisma.category.findFirst({
//       where: {
//         name: name
//       }
//     });

//     if (category) {
//       return new Category(category.name, category.color, category.id);
//     } else {
//       return category;
//     }
//   }
// }

// export class DemoRepo implements IDemo {
//   constructor(private prisma: PrismaClient | Prisma.TransactionClient) { }

//   async getImageUrls(): Promise<string[]> {
//     const demos = await this.prisma.demo.findMany();

//     return demos.map(demo => demo.url);
//   }
// }












export class AppServices {
  private static uow = uow;
}
