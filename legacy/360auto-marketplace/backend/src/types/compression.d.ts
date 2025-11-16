declare module 'compression' {
  import type { RequestHandler } from 'express';

  interface CompressionOptions {
    filter?(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]): boolean;
    threshold?: number | string;
    chunkSize?: number;
    level?: number;
    memLevel?: number;
  }

  function compression(options?: CompressionOptions): RequestHandler;

  export default compression;
}

