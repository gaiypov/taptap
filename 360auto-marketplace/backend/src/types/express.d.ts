// Extended Express types

import { ParamsDictionary, Query } from 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request<P extends ParamsDictionary = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query> {
    id?: string;
    user?: {
      id: string;
      role: string;
      phone: string;
    };
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  }
}

