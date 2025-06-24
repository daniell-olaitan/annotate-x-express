interface IBaseModelProps {
  id: string;
}

export interface IUserProps extends IBaseModelProps {
  username: string;
  password: string;
}

export interface IProjectProps extends IBaseModelProps {
  name: string;
}

export interface IDemoProps extends IBaseModelProps {
  url: string;
}

export interface IAnnotationProps extends IBaseModelProps {
  x: number;
  y: number;
  height: number;
  width: number;
}

export interface IImageProps extends IBaseModelProps {
  url: string;
  width: number;
  height: number;
  filename: string;
}

export interface ICategoryProps extends IBaseModelProps {
  name: string;
  color: string;
}

abstract class BaseModel implements IBaseModelProps {
  constructor(public id: string) { }
}

export class User extends BaseModel implements IUserProps {
  constructor(
    public username: string,
    public password: string,
    id: string
  ) {
    super(id);
  }
}

export class Project extends BaseModel implements IProjectProps {
  constructor(public name: string, id: string) {
    super(id);
  }
}

export class Demo extends BaseModel implements IDemoProps {
  constructor(public url: string, id: string) {
    super(id);
  }
}

export class Annotation extends BaseModel implements IAnnotationProps {
  constructor(
    public x: number,
    public y: number,
    public height: number,
    public width: number,
    id: string
  ) {
    super(id);
  }
}

export class Image extends BaseModel implements IImageProps {
  constructor(
    public url: string,
    public width: number,
    public height: number,
    public filename: string,
    id: string
  ) {
    super(id);
  }
}

export class Category extends BaseModel implements ICategoryProps {
  constructor(public name: string, public color: string, id: string) {
    super(id);
  }
}
