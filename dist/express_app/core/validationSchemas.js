"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnotationsPayloadSchema = void 0;
const zod_1 = require("zod");
const CategorySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    color: zod_1.z.string(),
});
const AnnotationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    x: zod_1.z.number(),
    y: zod_1.z.number(),
    width: zod_1.z.number(),
    height: zod_1.z.number(),
    category: CategorySchema,
});
exports.AnnotationsPayloadSchema = zod_1.z.array(AnnotationSchema);
