"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createApp;
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const express_session_1 = __importDefault(require("express-session"));
const authRouter_1 = __importDefault(require("./routes/authRouter"));
function createApp() {
    const app = (0, express_1.default)();
    app.set('views', node_path_1.default.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    const assetsPath = node_path_1.default.join(__dirname, "public");
    app.use(express_1.default.static(assetsPath));
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey)
        throw new Error("SECRET_KEY environment variable is not defined");
    app.use((0, express_session_1.default)({
        secret: secretKey,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false
        }
    }));
    app.use(authRouter_1.default);
    return app;
}
