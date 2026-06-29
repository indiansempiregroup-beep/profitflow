import { useMutation } from '@tanstack/react-query';
import { fetcher } from './api';

export const requestPasswordReset = async (email: string) =>
  fetcher<{ success: boolean; message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const resetPassword = async (token: string, password: string) =>
  fetcher<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });

export const sendVerificationCode = async () =>
  fetcher<{ success: boolean; message: string }>('/auth/send-verification', {
    method: 'POST',
  });

export const verifyEmail = async (code: string) =>
  fetcher<{ success: boolean; message: string }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

export const useRequestPasswordReset = () =>
  useMutation({
    mutationFn: requestPasswordReset,
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPassword(token, password),
  });

export const useSendVerificationCode = () =>
  useMutation({
    mutationFn: sendVerificationCode,
  });

export const useVerifyEmail = () =>
  useMutation({
    mutationFn: verifyEmail,
  });
