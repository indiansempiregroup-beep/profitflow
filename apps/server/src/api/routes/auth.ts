import type { FastifyPluginAsync } from 'fastify';
import { randomBytes, randomInt } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/database/client.js';
import { hashPassword, comparePassword, signAccessToken, verifyAccessToken } from '@/core/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});

const verifyEmailSchema = z.object({
  code: z.string().length(6),
});

const createVerificationCode = () => String(randomInt(100000, 999999));

const createResetToken = () => randomBytes(24).toString('hex');

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing) {
        return reply
          .status(409)
          .send({ success: false, error: { code: 'USER_EXISTS', message: 'User already exists' } });
      }

      const passwordHash = await hashPassword(body.password);
      const verificationCode = createVerificationCode();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          verificationCode,
          verificationCodeExpires,
        },
      });

      fastify.log.info(
        { email: user.email, verificationCode },
        'Email verification code generated',
      );

      const token = signAccessToken({ sub: user.id, email: user.email });
      return {
        success: true,
        token,
        user: { id: user.id, email: user.email, emailVerified: user.emailVerified },
        requiresEmailVerification: true,
      };
    } catch (error) {
      fastify.log.error({ error }, 'Registration route failed');
      throw error;
    }
  });

  fastify.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
      });
    }

    const ok = await comparePassword(body.password, user.passwordHash);
    if (!ok) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
      });
    }

    const token = signAccessToken({ sub: user.id, email: user.email });
    return {
      success: true,
      token,
      user: { id: user.id, email: user.email, emailVerified: user.emailVerified },
    };
  });

  fastify.get('/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const payload = verifyAccessToken(token);
    if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: String((payload as { sub: string }).sub) },
    });
    if (!user) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    return {
      success: true,
      user: { id: user.id, email: user.email, emailVerified: user.emailVerified },
    };
  });

  fastify.post('/auth/forgot-password', async (request) => {
    const body = forgotPasswordSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (user) {
      const resetToken = createResetToken();
      const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpires },
      });
      fastify.log.info({ email: user.email, resetToken }, 'Password reset token generated');
    }

    return {
      success: true,
      message: 'If an account exists for that email, reset instructions have been sent.',
    };
  });

  fastify.post('/auth/reset-password', async (request, reply) => {
    const body = resetPasswordSchema.parse(request.body);
    const user = await prisma.user.findFirst({
      where: {
        resetToken: body.token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Reset token is invalid or expired.' },
      });
    }

    const passwordHash = await hashPassword(body.password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { success: true, message: 'Password updated successfully.' };
  });

  fastify.post('/auth/send-verification', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const payload = verifyAccessToken(token);
    if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: String((payload as { sub: string }).sub) },
    });
    if (!user) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email is already verified.' };
    }

    const verificationCode = createVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode, verificationCodeExpires },
    });

    fastify.log.info({ email: user.email, verificationCode }, 'Email verification code resent');

    return { success: true, message: 'Verification code sent.' };
  });

  fastify.post('/auth/verify-email', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } });
    }

    const payload = verifyAccessToken(token);
    if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    const body = verifyEmailSchema.parse(request.body);
    const user = await prisma.user.findUnique({
      where: { id: String((payload as { sub: string }).sub) },
    });
    if (!user) {
      return reply
        .status(401)
        .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid auth token' } });
    }

    if (
      !user.verificationCode ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < new Date() ||
      user.verificationCode !== body.code
    ) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_CODE', message: 'Verification code is invalid or expired.' },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    return { success: true, message: 'Email verified successfully.' };
  });
};
