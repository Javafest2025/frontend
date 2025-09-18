// Polyfill for Promise.withResolvers for Node.js versions < 22
// This is needed for PDF.js compatibility

if (!Promise.withResolvers) {
    Promise.withResolvers = function <T>(): {
        promise: Promise<T>;
        resolve: (value: T | PromiseLike<T>) => void;
        reject: (reason?: any) => void;
    } {
        let resolve: (value: T | PromiseLike<T>) => void;
        let reject: (reason?: any) => void;

        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        return { promise, resolve: resolve!, reject: reject! };
    };
}

export { };
