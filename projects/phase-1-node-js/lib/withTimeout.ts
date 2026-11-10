export const withTimeout = <TPromise>(promise: Promise<TPromise>, ms: number) =>
    Promise.race([
        promise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms).unref()),
    ]);
