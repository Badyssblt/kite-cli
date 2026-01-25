const isDevMode = true;

export const debug = (...args: any[]) => {
    if (isDevMode) {
        console.log(
            'DEBUG MODE:',
            args.map(arg =>
                typeof arg === 'object'
                    ? JSON.stringify(arg, null, 2)
                    : arg
            )
        );
    }
};