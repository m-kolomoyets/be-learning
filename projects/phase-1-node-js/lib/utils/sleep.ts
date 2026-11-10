export const sleep = (ms: number, signal?: AbortSignal) => {
    return new Promise<void>((resolve, reject) => {
        signal?.throwIfAborted();

        const timer = setTimeout(resolve, ms);

        signal?.addEventListener(
            'abort',
            () => {
                clearTimeout(timer);
                reject(signal.reason);
            },
            { once: true }
        );
    });
};
