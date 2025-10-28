// Extended Express types

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
    user?: {
      id: string;
      role: string;
      phone: string;
    };
  }
}

