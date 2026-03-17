export interface PollingOptions<T> {
  fetcher: () => Promise<T>;
  intervalMs: number;
  timeoutMs: number;
  stopCondition: (data: T) => boolean;
  onTick?: (data: T) => void;
  onError?: (error: unknown, retryCount: number) => void;
}

export interface PollingController {
  cancel: () => void;
}

export const startPolling = <T>(options: PollingOptions<T>): PollingController => {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const startedAt = Date.now();
  let retryCount = 0;

  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const run = async () => {
    if (cancelled) return;

    if (Date.now() - startedAt > options.timeoutMs) {
      clear();
      return;
    }

    try {
      const data = await options.fetcher();
      retryCount = 0;
      options.onTick?.(data);

      if (options.stopCondition(data)) {
        clear();
        return;
      }

      timer = setTimeout(run, options.intervalMs);
    } catch (error) {
      retryCount += 1;
      options.onError?.(error, retryCount);

      const backoff = Math.min(options.intervalMs * (retryCount + 1), 15000);
      timer = setTimeout(run, backoff);
    }
  };

  void run();

  return {
    cancel: () => {
      cancelled = true;
      clear();
    },
  };
};
