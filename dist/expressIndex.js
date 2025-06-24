"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("./express_app/config"));
const appControllers_1 = __importDefault(require("./express_app/controllers/appControllers"));
const middlewares_1 = require("./express_app/core/middlewares");
const multerConfig_1 = __importDefault(require("./express_app/multerConfig"));
const app = (0, config_1.default)();
app.get('/', middlewares_1.loadLoggedInUser, appControllers_1.default.index);
app.get('/project/:id', middlewares_1.loadLoggedInUser, appControllers_1.default.displayProject);
app.post('/projects', middlewares_1.requireLogin, multerConfig_1.default.array('files'), appControllers_1.default.createProject);
app.get('/projects/:id', middlewares_1.requireLogin, appControllers_1.default.readProject);
app.get('/projects', middlewares_1.requireLogin, appControllers_1.default.listProjects);
app.delete('/projects/:id', middlewares_1.requireLogin, appControllers_1.default.deleteProject);
app.post('/projects/:pId/images/:iId/annotations', middlewares_1.requireLogin, express_1.default.json(), appControllers_1.default.createAnnotations);
app.post('/projects/:id/images', middlewares_1.requireLogin, multerConfig_1.default.array('files'), appControllers_1.default.addProjectImages);
app.delete('/images/:id', middlewares_1.requireLogin, appControllers_1.default.deleteImage);
app.get('/export/:id', middlewares_1.requireLogin, appControllers_1.default.exportProject);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        status: 'Failed',
        error: err.name || 'Internal Server Error',
        message: err.message || 'Something went wrong!',
    });
});
app.listen(3000, () => {
    console.log(`My first Express app - listening on port ${3000}!`);
});
