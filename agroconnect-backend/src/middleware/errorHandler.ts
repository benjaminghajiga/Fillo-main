import { Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Express.Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err.message);

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};

export const notFoundHandler = (req: Express.Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
};
