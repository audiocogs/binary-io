// define an error class to be thrown if an underflow occurs
export default class UnderflowError {
  constructor() {
    Error.call(this);
    this.name = 'UnderflowError';
    
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack;
    }
  }
}

// Extending Error doesn't work in Babel 6.x so do it manually.
// See https://phabricator.babeljs.io/T3083.
UnderflowError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: UnderflowError
  }
});

Object.setPrototypeOf(UnderflowError, Error);
