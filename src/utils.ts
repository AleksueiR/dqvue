function isFunction(x: any): x is () => any {
    return typeof x === 'function';
}

function isString(x: any): x is string {
    return typeof x === 'string';
}

function isObject(x: any): x is object {
    return x === Object(x);
}

function isPromise<T>(x: any): x is Promise<T> {
    return !!x && (typeof x === 'object' || typeof x === 'function') && typeof x.then === 'function';
  }

export {
    isFunction,
    isString,
    isObject,
    isPromise
};