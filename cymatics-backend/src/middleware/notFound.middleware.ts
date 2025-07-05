import { Request, Response } from 'express';
import { sendErrorResponse } from '@/utils/helpers';

export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendErrorResponse(
    res,
    {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
    404,
  );
};
