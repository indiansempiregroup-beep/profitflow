import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@/core/errors.js';

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

  await reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
};
