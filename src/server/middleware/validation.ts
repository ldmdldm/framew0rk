import { Request, Response, NextFunction } from 'express';
import { ZodSchema, z } from 'zod';

// Define a typed Request interface that includes body with the inferred schema type
interface TypedRequestBody<T> extends Request {
  body: T;
}

export function validateRequest<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      // Update the request object with the validated data
      (req as TypedRequestBody<T>).body = validatedData;
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
