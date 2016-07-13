import {Writable} from 'stream';

export default class BufferList extends Writable {
  constructor(options) {
    super();
    
    this._next = Symbol('next');
    this._prev = Symbol('prev');
    this._callback = Symbol('callback');
    
    this.first = null;
    this.last = null;
    this.numBuffers = 0;
    this.availableBytes = 0;
    this.availableBuffers = 0;    
  }
  
  copy() {
    let result = new BufferList();

    result.first = this.first;
    result.last = this.last;
    result.numBuffers = this.numBuffers;
    result.availableBytes = this.availableBytes;
    result.availableBuffers = this.availableBuffers;
    
    let buffer = result.first;
    while (buffer) {
      buffer[result._next] = buffer[this._next];
      buffer[result._prev] = buffer[this._prev];
      buffer = buffer[this._next];
    }
    
    return result;
  }
  
  append(buffer, callback) {
    buffer[this._callback] = callback;
    buffer[this._prev] = this.last;
    if (this.last) {
      this.last[this._next] = buffer;
    }
      
    this.last = buffer;
    if (!this.first) {
      this.first = buffer;
    }
    
    this.availableBytes += buffer.length;
    this.availableBuffers++;
    return this.numBuffers++;
  }
  
  _write(buffer, encoding, callback) {
    this.append(buffer, callback);
  }
  
  advance() {
    let first = this.first;
    if (first) {
      this.callback(first);
      this.availableBytes -= first.length;
      this.availableBuffers--;
      this.first = first[this._next];
      return this.first != null;
    }
      
    return false;
  }
    
  rewind() {
    if (this.first && !this.first[this._prev]) {
      return false;
    }
    
    this.first = (this.first && this.first[this._prev]) || this.last;
    if (this.first) {
      this.availableBytes += this.first.length;
      this.availableBuffers++;
    }
      
    return this.first != null;
  }
  
  reset() {
    while (this.rewind());
  }
  
  canAdvance() {
    return !!this.first[this._next];
  }
  
  canRewind() {
    return !!this.first[this._prev];
  }
  
  next(buffer) {
    return buffer[this._next];
  }
  
  prev(buffer) {
    return buffer[this._prev];
  }
  
  callback(buffer = this.last) {
    let callback = buffer && buffer[this._callback];
    if (typeof callback === 'function') {
      delete buffer[this._callback];
      callback();
    }
  }
}
