"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = exports.Image = exports.Annotation = exports.Demo = exports.Project = exports.User = void 0;
class BaseModel {
    constructor(id) {
        this.id = id;
    }
}
class User extends BaseModel {
    constructor(username, password, id) {
        super(id);
        this.username = username;
        this.password = password;
    }
}
exports.User = User;
class Project extends BaseModel {
    constructor(name, id) {
        super(id);
        this.name = name;
    }
}
exports.Project = Project;
class Demo extends BaseModel {
    constructor(url, id) {
        super(id);
        this.url = url;
    }
}
exports.Demo = Demo;
class Annotation extends BaseModel {
    constructor(x, y, height, width, id) {
        super(id);
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
    }
}
exports.Annotation = Annotation;
class Image extends BaseModel {
    constructor(url, width, height, filename, id) {
        super(id);
        this.url = url;
        this.width = width;
        this.height = height;
        this.filename = filename;
    }
}
exports.Image = Image;
class Category extends BaseModel {
    constructor(name, color, id) {
        super(id);
        this.name = name;
        this.color = color;
    }
}
exports.Category = Category;
