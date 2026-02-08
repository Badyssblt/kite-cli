let verboseMode = false;

export function setVerbose(enabled: boolean): void {
  verboseMode = enabled;
}

export function isVerbose(): boolean {
  return verboseMode;
}

export const debug = (...args: any[]) => {
  if (verboseMode) {
    console.log(
      '\x1b[90m[debug]\x1b[0m',
      ...args.map(arg =>
        typeof arg === 'object'
          ? JSON.stringify(arg, null, 2)
          : arg
      )
    );
  }
};