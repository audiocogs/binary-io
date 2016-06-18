export default class BufferList {
  constructor() {
    this._next = Symbol('next');
    this._prev = Symbol('prev');
    
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
    
  append(buffer) {
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
    
  advance() {
    if (this.first) {
      this.availableBytes -= this.first.length;
      this.availableBuffers--;
      this.first = this.first[this._next];
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
}
