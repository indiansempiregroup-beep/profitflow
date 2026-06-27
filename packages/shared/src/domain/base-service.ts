import type { Result } from './result';

export abstract class BaseService {
  protected async safeExecute<T>(operation: () => Promise<T>): Promise<Result<T>> {
    try {
      const value = await operation();
      return { ok: true, value };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Unknown service error'),
      };
    }
  }
}
