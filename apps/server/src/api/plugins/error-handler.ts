import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '@/core/errors.js';

const isDev = process.env.NODE_ENV !== 'production';

export const errorHandler = async (
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error instanceof AppError) {
    await reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    await reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check the highlighted fields and try again.',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  const responseBody = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev
        ? (error.message ?? 'An unexpected error occurred.')
        : 'An unexpected error occurred.',
      ...(isDev ? { detail: error.stack } : {}),
    },
  } as const;

  await reply.status(500).send(responseBody);
};
