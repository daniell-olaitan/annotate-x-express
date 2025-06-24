import { IProjectProps, IImageProps, User, Project, Category, Image, ICategoryProps, Annotation, IAnnotationProps } from "../app/models";
import { BadRequest, InternalServalError, NotFound } from "../express_app/core/httpErrors";
import { v4 as uuid4 } from 'uuid';
import { generateUniqueName, ImageUtil } from "../utils";
import { z } from "zod";
import { AnnotationsPayloadSchema } from "../express_app/core/validationSchemas";
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { AxiosResponse } from 'axios';
import { uow } from "../storage/uow";

const imageUtil = new ImageUtil();

interface ProjectCreateData {
  name: string;
  categories: [string, string][];
  files: Buffer[];
}

export default class AppServices {
  private static uow = uow;

  static async confirmProject(id: string): Promise<boolean> {
    try {
      await this.uow.projectRepo.getById(id);
      return true;
    } catch (_error) {
      return false;
    }
  }

  static async createNewProject(
    userId: string,
    data: ProjectCreateData
  ): Promise<IProjectProps> {
    const projectName = data.name.toUpperCase();

    try {
      await this.uow.projectRepo.getByName(projectName);
      throw new BadRequest('Project name already exist');
    } catch (error) {
      if (!(error instanceof NotFound)) throw error;
    }

    // Prepare image names & buffers
    const files: [string, Buffer][] = [];
    const imageNames: string[] = [];

    data.files.forEach(img => {
      const imageName = generateUniqueName(imageNames, 'image');

      imageNames.push(imageName);
      files.push([imageName, img]);
    });

    // Upload images
    let uploadedImages;
    try {
      uploadedImages = await imageUtil.uploadImages(files, `EXPRESS/${projectName}`);
    } catch (error) {
      throw new InternalServalError('Network Error');
    }

    return this.uow.runInTransaction(async ({
      projectRepo, categoryRepo, imageRepo
    }) => {
      // Create and save new project
      const project = new Project(projectName, uuid4());
      const projectData = await projectRepo!.create({ ...project, userId });

      // Create and save new categories for the project
      const categories = data.categories.map(c => new Category(c[0], c[1], uuid4()));
      await categoryRepo!.createMany(
        categories.map(c => ({ ...c, projectId: project.id }))
      );

      // Save uploaded images
      const images = uploadedImages.map(
        img => new Image(img.url, img.width, img.height, img.filename, uuid4())
      );

      await imageRepo!.createMany(
        images.map(img => ({ ...img, projectId: project.id }))
      );

      return projectData;
    });
  }

  static async getProject(id: string): Promise<any> {
    return await this.uow.projectRepo.getWithRelationships(id);
  }

  static async getUserProjects(userId: string): Promise<IProjectProps[]> {
    return await this.uow.projectRepo.list(userId);
  }

  static async deleteProject(id: string): Promise<void> {
    await this.uow.projectRepo.remove(id);
  }

  static async createNewAnnotations(
    pId: string,
    iId: string,
    data: z.infer<typeof AnnotationsPayloadSchema>
  ): Promise<void> {
    // Validate ids
    await this.uow.imageRepo.getById(iId);
    await this.uow.projectRepo.getById(pId);

    return this.uow.runInTransaction(async ({
      annotationRepo, categoryRepo
    }) => {
      // Remove the existing annotations to be replaced with newly created ones
      await annotationRepo!.removeImageAnnotations(iId);

      //Create new annotations and categories
      await Promise.all(data.map(async (annotation) => {
        const annotatn = new Annotation(
          annotation.x,
          annotation.y,
          annotation.height,
          annotation.width,
          uuid4()
        );

        let categoryId;
        try {
          const categoryData = await categoryRepo!.getByName(annotation.category.name);
          categoryId = categoryData.id;
        } catch (_error) {
          const category = new Category(
            annotation.category.name,
            annotation.category.color,
            uuid4()
          );

          const categoryData = await categoryRepo!.create({ ...category, projectId: pId });
          categoryId = categoryData.id;
        }

        await annotationRepo!.create({ ...annotatn, imageId: iId, categoryId });
      }));
    });
  }

  static async addImagesToAProject(projectId: string, imageFiles: Buffer[]): Promise<any> {
    const project = await this.uow.projectRepo.getById(projectId);

    // Upload and save images
    const files: [string, Buffer][] = [];
    const projectImages = await this.uow.imageRepo.getProjectImages(projectId);
    const imageNames = projectImages.map(img => img.filename);

    imageFiles.forEach(img => {
      const imageName = generateUniqueName(imageNames, 'image');

      imageNames.push(imageName);
      files.push([imageName, img]);
    });

    let uploadedImages;
    try {
      uploadedImages = await imageUtil.uploadImages(files, `EXPRESS/${project.name}`);
    } catch (error) {
      throw new InternalServalError('Network Error');
    }

    const images = uploadedImages.map(
      img => new Image(img.url, img.width, img.height, img.filename, uuid4())
    );

    const imagesData = await this.uow.imageRepo.createMany(
      images.map(img => ({ ...img, projectId: project.id }))
    );

    return imagesData.map(imageData => ({ ...imageData, annotations: [] }));
  }

  static async deleteImage(imageId: string): Promise<void> {
    const img = await this.uow.imageRepo.getById(imageId);

    try {
      const image = new Image(img.url, img.width, img.height, img.filename, uuid4());

      await imageUtil.deleteImage(image);
    } catch (error) {
      throw new InternalServalError('Network Error');
    }

    await this.uow.imageRepo.remove(imageId);
  }

  static async zipProject(projectId: string): Promise<[string, PassThrough]> {
    const project = await this.uow.projectRepo.getWithRelationships(projectId);
    const projectName = project.name.toLowerCase();

    const imageUrls: string[] = [];
    const annotations: Record<string, any>[] = [];

    const categories = project.categories.map((c: ICategoryProps) => ({ id: c.id, name: c.name }));
    const images = project.images.map((img: any) => {
      const { id, url, width, height, filename, ..._ } = img;
      img.annotations.forEach((a: any) => {
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

    let responses: AxiosResponse[];
    try {
      responses = await imageUtil.fetchImages(imageUrls);
    } catch (error) {
      throw new InternalServalError('Network Error');
    }

    const zipStream = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });

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
  }
}
