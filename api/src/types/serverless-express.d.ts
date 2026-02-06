declare module '@codegenie/serverless-express/src/middleware' {
  import type { NextFunction, Request, Response } from 'express';

  export function eventContext(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;
}
