"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createApp;
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const express_session_1 = __importDefault(require("express-session"));
function createApp() {
    const app = (0, express_1.default)();
    app.set('views', node_path_1.default.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    const assetsPath = node_path_1.default.join(__dirname, "public");
    app.use(express_1.default.static(assetsPath));
    app.use((0, express_session_1.default)({
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false
        }
    }));
    return app;
}
