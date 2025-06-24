import { z } from 'zod';

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

const AnnotationSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  category: CategorySchema,
});

export const AnnotationsPayloadSchema = z.array(AnnotationSchema);
