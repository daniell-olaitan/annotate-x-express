import { Category, Project, User, Image } from "../app/models";
import { uow } from "../storage/uow";
import bcrypt from 'bcrypt';
import { generateUniqueName } from "../utils";
import { v4 as uuid4 } from 'uuid';
import { ImageUtil } from "../utils";
import { BadRequest, InternalServalError } from "../express_app/core/httpErrors";

interface userInput {
  username: string;
  password: string;
}

const imageUtil = new ImageUtil();

export class AuthServices {
  private static uow = uow;

  static async confirmUserId(userId: string): Promise<boolean> {
    try {
      const _user = await this.uow.userRepo.getById(userId);
      return true;
    } catch (_error) {
      return false;
    }
  }

  static async createDemo(): Promise<[string, string]> {
    const usernames = (await this.uow.userRepo.list()).map(user => user.username);
    const username = generateUniqueName(usernames, 'demo');

    const saltRounds = 10;

    let password;
    try {
      password = await bcrypt.hash('demo', saltRounds);
    } catch (error) {
      throw new InternalServalError('Something went wrong');
    }

    const user = new User(username, password, uuid4());

    return this.uow.runInTransaction(async ({
      userRepo, categoryRepo, projectRepo, imageRepo, demoRepo
    }) => {
      // Create a demo user
      const userData = await userRepo!.create({ ...user });

      // Create and save default project
      const projectName = generateUniqueName([], 'project').toUpperCase();
      const project = new Project(projectName, uuid4());
      const _projectData = await projectRepo!.create({ ...project, userId: user.id });

      // Create and save default categories
      const categoryData = [
        ['class1', 'purple'],
        ['class2', 'brown'],
        ['class3', 'green'],
        ['class4', 'blue']
      ];

      const categories = categoryData.map(c => new Category(c[0], c[1], uuid4()));
      const _categoriesData = await categoryRepo!.createMany(
        categories.map(c => ({ ...c, projectId: project.id }))
      );

      // Fetch and upload demo images
      const demoImageUrls = (await demoRepo!.getDemos()).map(demo => demo.url);

      let imageFiles;
      try {
        imageFiles = await imageUtil.fetchImages(demoImageUrls);
      } catch (error) {
        throw new InternalServalError('Network Error');
      }

      const files: [string, Buffer][] = [];
      const imageNames: string[] = [];

      imageFiles.forEach(img => {
        const imageName = generateUniqueName(imageNames, 'image');

        imageNames.push(imageName);
        files.push([imageName, img.data]);
      });

      let uploadedImages;
      try {
        uploadedImages = await imageUtil.uploadImages(files, `EXPRESS/${projectName}`);
      } catch (error) {
        throw new InternalServalError('Network Error');
      }

      const images = uploadedImages.map(
        img => new Image(img.url, img.width, img.height, img.filename, uuid4())
      );

      const _imagesData = await imageRepo!.createMany(
        images.map(img => ({ ...img, projectId: project.id }))
      );

      return [user.id, project.id];
    });
  }

  static async signInUser(userData: userInput): Promise<string> {
    const user = await this.uow.userRepo.getByUsername(userData.username);

    let status;
    try {
      status = await bcrypt.compare(userData.password, user.password);
    } catch (error) {
      throw new InternalServalError('Something went wrong');
    }

    if (status) {
      return user.id;
    } else {
      throw new BadRequest('Incorrect password');
    }
  }

  static async signUpUser(userData: userInput): Promise<void> {
    try {
      const _user = await this.uow.userRepo.getByUsername(userData.username);
    } catch (error) {
      const saltRounds = 10;
      let password;

      try {
        password = await bcrypt.hash(userData.password, saltRounds);
      } catch (error) {
        throw new InternalServalError('Something went wrong');
      }

      const user = new User(userData.username, password, uuid4());
      const _user = await this.uow.userRepo.create({ ...user });

      return;
    }

    throw new BadRequest('Username already exist');
  }

  static async fetchUserProjectId(userId: string): Promise<string> {
    return (await this.uow.projectRepo.list(userId))[0].id;
  }

  static async destroyDemoData(userId: string): Promise<void> {
    return this.uow.runInTransaction(async ({ projectRepo, userRepo }) => {
      for (const project of await projectRepo!.list(userId)) {
        try {
          imageUtil.deleteAll(project.name);
        } catch {
          throw new InternalServalError('Network Error');
        }
      }

      await userRepo!.remove(userId);
    });
  }
}
