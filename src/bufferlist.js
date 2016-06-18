export default class BufferList {
  constructor() {
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
    
    return result;
  }
    
  append(buffer) {
    buffer.prev = this.last;
    if (this.last) {
      this.last.next = buffer;
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
      this.first = this.first.next;
      return this.first != null;
    }
      
    return false;
  }
    
  rewind() {
    if (this.first && !this.first.prev) {
      return false;
    }
    
    this.first = (this.first && this.first.prev) || this.last;
    if (this.first) {
      this.availableBytes += this.first.length;
      this.availableBuffers++;
    }
      
    return this.first != null;
  }
  
  reset() {
    while (this.rewind());
  }
}
