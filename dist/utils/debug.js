"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = void 0;
const isDevMode = true;
const debug = (...args) => {
    if (isDevMode) {
        console.log('DEBUG MODE:', args.map(arg => typeof arg === 'object'
            ? JSON.stringify(arg, null, 2)
            : arg));
    }
};
exports.debug = debug;
