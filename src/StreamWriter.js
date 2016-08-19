import {Writable} from 'stream';

const BUFFER_SIZE = 65536;

export default class StreamWriter extends Writable {
  constructor(stream) {
    super();
    this.stream = stream || this;
    this.buffer = new Uint8Array(BUFFER_SIZE);
    this.view = new DataView(this.buffer.buffer);
    this.queue = [];
    this.bufferOffset = 0;
    this.offset = 0;
  }
  
  flush() {
    if (this.bufferOffset > 0) {
      this.stream.write(new Buffer(this.buffer.subarray(0, this.bufferOffset)));
      this.bufferOffset = 0;
    }
  }
  
  end() {
    this.flush();
    this.stream.end();
  }
  
  ensure(bytes) {
    if (this.bufferOffset + bytes > this.buffer.length) {
      this.flush();
    }
  }
  
  advance(bytes) {
    // ??? fill with 0?
  }
  
  seek(offset) {
    if (typeof this.stream.seek === 'function') {
      this.flush();
      this.stream.seek(offset);
    } else {
      throw new Error('Stream is not seekable');
    }
  }
  
  writeUInt8(val) {
    this.ensure(1);
    this.buffer[this.bufferOffset++] = val;
    this.offset++;
  }
  
  writeInt8(val) {
    this.ensure(1);
    this.view.setInt8(this.bufferOffset++, val);
    this.offset++;
  }
  
  writeUInt16(val, littleEndian) {
    this.ensure(2);
    this.view.setUint16(this.bufferOffset, val, littleEndian);
    this.bufferOffset += 2;
    this.offset += 2;
  }
  
  writeInt16(val, littleEndian) {
    this.ensure(2);
    this.view.setInt16(this.bufferOffset, val, littleEndian);
    this.bufferOffset += 2;
    this.offset += 2;
  }
  
  writeUInt24(val, littleEndian) {
    if (littleEndian) {
      this.writeUInt8(val & 0xff);
      this.writeUInt8(val >>> 8 & 0xff);
      this.writeUInt8(val >>> 16 & 0xff);
    } else {
      this.writeUInt8(val >>> 16 & 0xff);
      this.writeUInt8(val >>> 8 & 0xff);
      this.writeUInt8(val & 0xff);
    }
  }
  
  writeInt24(val, littleEndian) {
    this.writeUInt24(val >= 0 ? val : val + 0xffffff + 1, littleEndian);
  }
  
  writeUInt32(val, littleEndian) {
    this.ensure(4);
    this.view.setUint32(this.bufferOffset, val, littleEndian);
    this.bufferOffset += 4;
    this.offset += 4;
  }
  
  writeInt32(val, littleEndian) {
    this.ensure(4);
    this.view.setInt32(this.bufferOffset, val, littleEndian);
    this.bufferOffset += 4;
    this.offset += 4;
  }
  
  writeFloat32(val, littleEndian) {
    this.ensure(4);
    this.view.setFloat32(this.bufferOffset, val, littleEndian);
    this.bufferOffset += 4;
    this.offset += 4;
  }
  
  writeFloat64(val, littleEndian) {
    this.ensure(8);
    this.view.setFloat64(this.bufferOffset, val, littleEndian);
    this.bufferOffset += 8;
    this.offset += 8;
  }
  
  writeFloat80(val, littleEndian) {
    // TODO
  }
  
  writeBuffer(buffer) {
    this.flush();
    this.stream.push(buffer);
    this.offset += buffer.length;
  }
  
  writeString(string, encoding, nullTerminated) {
    let buf = new Buffer(string, encoding);
    if (buf.length < this.buffer.length) {
      this.ensure(buf.length);
      this.buffer.set(buf, this.bufferOffset);
      this.bufferOffset += buf.length;
      this.offset += buf.length;
    } else {
      this.writeBuffer(buf);
    }
  }
}
