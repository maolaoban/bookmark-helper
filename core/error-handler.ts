/**
 * 错误处理模块
 * 提供重试策略和优雅降级
 */

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoff?: 'linear' | 'exponential';
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 1000,
  backoff: 'exponential',
};

/**
 * 带重试的异步函数执行
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < opts.maxRetries) {
        const delay =
          opts.backoff === 'exponential'
            ? opts.delayMs * Math.pow(2, attempt)
            : opts.delayMs * (attempt + 1);

        console.warn(
          `[Retry] 第 ${attempt + 1} 次尝试失败，${delay}ms 后重试:`,
          lastError.message,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * 安全执行异步函数，返回 [result, error] 元组
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}
