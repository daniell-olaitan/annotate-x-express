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
exports.ImageUtil = void 0;
exports.generateUniqueName = generateUniqueName;
const cloudinary_1 = require("cloudinary");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const loglevel_1 = __importDefault(require("loglevel"));
const crypto_1 = __importDefault(require("crypto"));
// Configure logging
loglevel_1.default.setLevel('info');
// Cloudinary configuration
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
function generateUniqueName(strArray, affix) {
    const strLen = 5;
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const strSet = new Set(strArray);
    const generateRandomName = () => `${affix}-${[...Array(strLen)].map(() => letters.charAt(Math.floor(Math.random() * letters.length))).join('')}`;
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
class ImageUtil {
    constructor(retries = 1) {
        this.retries = retries;
    }
    uploadImages(files, folder) {
        return __awaiter(this, void 0, void 0, function* () {
            const upload = (axiosInstance_1, _a) => __awaiter(this, [axiosInstance_1, _a], void 0, function* (axiosInstance, [filename, buffer]) {
                var _b;
                const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
                const apiKey = process.env.CLOUDINARY_API_KEY;
                const apiSecret = process.env.CLOUDINARY_API_SECRET;
                if (!cloudName || !apiKey || !apiSecret) {
                    throw new Error("Cloudinary credentials are not set");
                }
                const timestamp = Math.floor(Date.now() / 1000).toString();
                const paramsToSign = `folder=${folder}&public_id=${filename}&timestamp=${timestamp}${apiSecret}`;
                const signature = crypto_1.default.createHash("sha1").update(paramsToSign).digest("hex");
                const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
                const formData = new form_data_1.default();
                formData.append("file", buffer, { filename });
                formData.append("api_key", apiKey);
                formData.append("timestamp", timestamp);
                formData.append("public_id", filename);
                formData.append("folder", folder);
                formData.append("signature", signature);
                const response = yield axiosInstance.post(uploadUrl, formData, {
                    headers: ((_b = formData.getHeaders) === null || _b === void 0 ? void 0 : _b.call(formData)) || {},
                });
                return response.data;
            });
            let attempt = 0;
            while (attempt < this.retries) {
                try {
                    loglevel_1.default.info(`Uploading ${files.length} image(s) to folder: ${folder}`);
                    const axiosInstance = axios_1.default.create({ timeout: 30000 });
                    const responses = yield Promise.all(files.map(file => upload(axiosInstance, file)));
                    loglevel_1.default.info("Images uploaded successfully");
                    return responses.map((res, i) => ({
                        url: res.secure_url,
                        filename: files[i][0],
                        width: res.width,
                        height: res.height,
                    }));
                }
                catch (error) {
                    attempt++;
                    loglevel_1.default.warn(`Upload attempt ${attempt} failed: ${error.message}`);
                    if (attempt >= this.retries) {
                        loglevel_1.default.error("Exceeded max retry attempts.");
                        throw error;
                    }
                }
            }
            throw new Error("Unreachable uploadImages error");
        });
    }
    fetchImages(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            const fetchImage = (axiosInstance, url) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield axiosInstance.get(url, { responseType: 'arraybuffer' });
                    return response;
                }
                catch (error) {
                    console.log(error);
                    throw error;
                }
            });
            let attempt = 0;
            while (attempt < this.retries) {
                try {
                    loglevel_1.default.info('Fetching images');
                    const axiosInstance = axios_1.default.create({ timeout: 30000 });
                    const fetchPromises = urls.map(url => fetchImage(axiosInstance, url));
                    const responses = yield Promise.all(fetchPromises);
                    loglevel_1.default.info('Images fetched successfully');
                    return responses;
                }
                catch (error) {
                    attempt++;
                    loglevel_1.default.warn(`Fetch attempt ${attempt} failed: ${error}`);
                    if (attempt >= this.retries) {
                        loglevel_1.default.error(`Failed to fetch images after ${this.retries} attempts.`);
                        throw error;
                    }
                }
            }
            throw new Error('Unreachable fetchImages error');
        });
    }
    deleteImage(image) {
        return __awaiter(this, void 0, void 0, function* () {
            const urlParts = image.url.split('/');
            const publicId = urlParts.slice(-3).join('/').split('.')[0];
            let attempt = 0;
            while (attempt < this.retries) {
                try {
                    loglevel_1.default.info(`Attempting to delete image: ${publicId} (Attempt ${attempt + 1})`);
                    const response = yield cloudinary_1.v2.uploader.destroy(publicId);
                    if (response.result === 'ok') {
                        loglevel_1.default.info(`Image deleted successfully: ${publicId}`);
                        return;
                    }
                    else {
                        loglevel_1.default.warn(`Unexpected response for image deletion: ${JSON.stringify(response)}`);
                        throw new Error(`Deletion failed for ${publicId}: ${response.result}`);
                    }
                }
                catch (error) {
                    attempt++;
                    loglevel_1.default.warn(`Attempt ${attempt} failed to delete ${publicId}: ${error.message}`);
                    if (attempt >= this.retries) {
                        loglevel_1.default.error(`Failed to delete image ${publicId} after ${this.retries} attempts.`);
                        throw error;
                    }
                }
            }
        });
    }
    deleteAll(folder) {
        return __awaiter(this, void 0, void 0, function* () {
            let attempt = 0;
            while (attempt < this.retries) {
                try {
                    loglevel_1.default.info(`Deleting images in folder: ${folder}`);
                    cloudinary_1.v2.api.delete_resources_by_prefix(`${folder}/`, {}, (error, result) => {
                        if (error)
                            throw error;
                        console.log(error);
                        if ('deleted' in result) {
                            loglevel_1.default.info('Images deleted successfully');
                        }
                        else {
                            loglevel_1.default.warn('Unexpected response');
                            throw new Error('Unexpected response');
                        }
                    });
                    break;
                }
                catch (error) {
                    attempt++;
                    loglevel_1.default.warn(`Attempt ${attempt} failed to delete folder ${folder}`);
                    if (attempt >= this.retries) {
                        loglevel_1.default.error('Failed to delete images after multiple attempts.');
                        throw error;
                    }
                }
            }
        });
    }
}
exports.ImageUtil = ImageUtil;
