import cloudinary from 'cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData from 'form-data';
import log from 'loglevel';
import crypto from 'crypto';

import { Image } from './app/models';

// Configure logging
log.setLevel('info');

// Cloudinary configuration
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadedImage {
  url: string;
  filename: string;
  width: number;
  height: number;
}

export function generateUniqueName(strArray: string[], affix: string): string {
  const strLen = 5;
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const strSet = new Set(strArray);

  const generateRandomName = () =>
    `${affix}-${[...Array(strLen)].map(() =>
      letters.charAt(Math.floor(Math.random() * letters.length))
    ).join('')}`;

  let randomName = generateRandomName();
  let attempts = 0;
  const maxAttempts = 1000;

  while (strSet.has(randomName)) {
    if (++attempts > maxAttempts) {
      throw new Error("Failed to generate a unique name after 1000 attempts");
    }
    randomName = generateRandomName();
  }

  return randomName;
}

export class ImageUtil {
  private retries: number;

  constructor(retries: number = 1) {
    this.retries = retries;
  }

  async uploadImages(
    files: [string, Buffer][],
    folder: string
  ): Promise<UploadedImage[]> {
    const upload = async (
      axiosInstance: AxiosInstance,
      [filename, buffer]: [string, Buffer]
    ): Promise<any> => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary credentials are not set");
      }

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const paramsToSign = `folder=${folder}&public_id=${filename}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const formData = new FormData();

      formData.append("file", buffer, { filename });
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("public_id", filename);
      formData.append("folder", folder);
      formData.append("signature", signature);

      const response: AxiosResponse = await axiosInstance.post(uploadUrl, formData, {
        headers: formData.getHeaders?.() || {},
      });

      return response.data;
    };

    let attempt = 0;
    while (attempt < this.retries) {
      try {
        log.info(`Uploading ${files.length} image(s) to folder: ${folder}`);

        const axiosInstance = axios.create({ timeout: 30000 });
        const responses = await Promise.all(
          files.map(file => upload(axiosInstance, file))
        );

        log.info("Images uploaded successfully");

        return responses.map((res, i) => ({
          url: res.secure_url,
          filename: files[i][0],
          width: res.width,
          height: res.height,
        }));
      } catch (error) {
        attempt++;
        log.warn(`Upload attempt ${attempt} failed: ${(error as Error).message}`);

        if (attempt >= this.retries) {
          log.error("Exceeded max retry attempts.");
          throw error;
        }
      }
    }

    throw new Error("Unreachable uploadImages error");
  }

  async fetchImages(urls: string[]): Promise<AxiosResponse[]> {
    const fetchImage = async (
      axiosInstance: AxiosInstance,
      url: string
    ): Promise<AxiosResponse> => {
      const response = await axiosInstance.get(url, { responseType: 'arraybuffer' });
      return response;
    };

    let attempt = 0;
    while (attempt < this.retries) {
      try {
        log.info('Fetching images');

        const axiosInstance = axios.create({ timeout: 30000 });
        const fetchPromises = urls.map(url => fetchImage(axiosInstance, url));
        const responses = await Promise.all(fetchPromises);

        log.info('Images fetched successfully');

        return responses;
      } catch (error) {
        attempt++;
        log.warn(`Fetch attempt ${attempt} failed: ${error}`);

        if (attempt >= this.retries) {
          log.error(`Failed to fetch images after ${this.retries} attempts.`);
          throw error;
        }
      }
    }
    throw new Error('Unreachable fetchImages error');
  }

  async deleteImage(image: Image): Promise<void> {
    const urlParts = image.url.split('/');
    const publicId = urlParts.slice(-3).join('/').split('.')[0];

    let attempt = 0;
    while (attempt < this.retries) {
      try {
        log.info(`Attempting to delete image: ${publicId} (Attempt ${attempt + 1})`);

        const response = await cloudinaryV2.uploader.destroy(publicId);

        if (response.result === 'ok') {
          log.info(`Image deleted successfully: ${publicId}`);
          return;
        } else {
          log.warn(`Unexpected response for image deletion: ${JSON.stringify(response)}`);
          throw new Error(`Deletion failed for ${publicId}: ${response.result}`);
        }
      } catch (error) {
        attempt++;
        log.warn(`Attempt ${attempt} failed to delete ${publicId}: ${(error as Error).message}`);

        if (attempt >= this.retries) {
          log.error(`Failed to delete image ${publicId} after ${this.retries} attempts.`);
          throw error;
        }
      }
    }
  }

  async deleteAll(folder: string): Promise<void> {
    let attempt = 0;
    while (attempt < this.retries) {
      try {
        log.info(`Deleting images in folder: ${folder}`);

        cloudinaryV2.api.delete_resources_by_prefix(`${folder}/`, {}, (error, result) => {
          if (error) throw error;
          if ('deleted' in result) {
            log.info('Images deleted successfully');
          } else {
            log.warn('Unexpected response');
            throw new Error('Unexpected response');
          }
        });
        break;
      } catch (error) {
        attempt++;

        log.warn(`Attempt ${attempt} failed to delete folder ${folder}`);
        if (attempt >= this.retries) {
          log.error('Failed to delete images after multiple attempts.');
          throw error;
        }
      }
    }
  }
}
