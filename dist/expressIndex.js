"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config_1 = __importDefault(require("./express_app/config"));
const app = (0, config_1.default)();
app.get('/', (req, res) => {
    if (!req.session.userId)
        res.redirect('/signin');
    res.render('index', {
        content: 'pages/project',
        projectId: null
    });
});
app.listen(3000, () => {
    console.log(`My first Express app - listening on port ${3000}!`);
});
