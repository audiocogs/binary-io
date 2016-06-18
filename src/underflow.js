// define an error class to be thrown if an underflow occurs
export default class UnderflowError extends Error {
  constructor() {
    super();
    this.name = 'UnderflowError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack;
    }
  }
}
