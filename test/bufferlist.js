import {BufferList} from '../';
import assert from 'assert';

describe('bufferlist', function() {
  it('append', function() {
    let list = new BufferList();
    let buffer = new Uint8Array([1, 2, 3]);
    list.append(buffer);
    
    assert.equal(1, list.numBuffers);
    assert.equal(1, list.availableBuffers);
    assert.equal(3, list.availableBytes);
    assert.equal(buffer, list.first);
    assert.equal(buffer, list.last);
    assert.equal(null, list.prev(buffer));
    assert.equal(null, list.next(buffer));
    
    let buffer2 = new Uint8Array([4, 5, 6]);
    list.append(buffer2);
    
    assert.equal(2, list.numBuffers);
    assert.equal(2, list.availableBuffers);
    assert.equal(6, list.availableBytes);
    assert.equal(buffer, list.first);
    assert.equal(buffer2, list.last);
    
    assert.equal(null, list.prev(buffer));
    assert.equal(buffer2, list.next(buffer));
    assert.equal(buffer, list.prev(buffer2));
    assert.equal(null, list.next(buffer2));
  });
    
  it('advance', function() {
    let list = new BufferList();
    let buffer1 = new Uint8Array(3);
    let buffer2 = new Uint8Array(3);
    list.append(buffer1);
    list.append(buffer2);
    
    assert.equal(2, list.numBuffers);
    assert.equal(2, list.availableBuffers);
    assert.equal(6, list.availableBytes);
    assert.equal(buffer1, list.first);
    
    assert.equal(true, list.advance());
    assert.equal(2, list.numBuffers);
    assert.equal(1, list.availableBuffers);
    assert.equal(3, list.availableBytes);
    assert.equal(buffer2, list.first);

    assert.equal(false, list.advance());
    assert.equal(null, list.first);
    assert.equal(2, list.numBuffers);
    assert.equal(0, list.availableBuffers);
    assert.equal(0, list.availableBytes);
  });
    
  it('rewind', function() {
    let list = new BufferList();
    let buffer1 = new Uint8Array(3);
    let buffer2 = new Uint8Array(3);
    list.append(buffer1);
    list.append(buffer2);
    
    assert.equal(2, list.numBuffers);
    assert.equal(2, list.availableBuffers);
    assert.equal(6, list.availableBytes);
    
    assert.equal(true, list.advance());
    assert.equal(buffer2, list.first);
    assert.equal(2, list.numBuffers);
    assert.equal(1, list.availableBuffers);
    assert.equal(3, list.availableBytes);
    
    assert.equal(true, list.rewind());
    assert.equal(buffer1, list.first);
    assert.equal(2, list.numBuffers);
    assert.equal(2, list.availableBuffers);
    assert.equal(6, list.availableBytes);
    
    // can't rewind anymore so nothing should change
    assert.equal(false, list.rewind());
    assert.equal(buffer1, list.first);
    assert.equal(2, list.numBuffers);
    assert.equal(2, list.availableBuffers);
    assert.equal(6, list.availableBytes);
    
    // advancing past the end of the list and then rewinding should give us the last buffer
    assert.equal(true, list.advance());
    assert.equal(false, list.advance());
    assert.equal(null, list.first);
    assert.equal(2, list.numBuffers);
    assert.equal(0, list.availableBuffers);
    assert.equal(0, list.availableBytes);
    
    assert.equal(true, list.rewind());
    assert.equal(buffer2, list.first);
    assert.equal(2, list.numBuffers);
    assert.equal(1, list.availableBuffers);
    assert.equal(3, list.availableBytes);
  });
    
  it('reset', function() {
    let list = new BufferList();
    let buffer1 = new Uint8Array(3);
    let buffer2 = new Uint8Array(3);
    let buffer3 = new Uint8Array(3);
    list.append(buffer1);
    list.append(buffer2);
    list.append(buffer3);
    
    assert.equal(buffer1, list.first);
    assert.equal(3, list.numBuffers);
    assert.equal(3, list.availableBuffers);
    assert.equal(9, list.availableBytes);
    
    assert.equal(true, list.advance());
    assert.equal(buffer2, list.first);
    assert.equal(3, list.numBuffers);
    assert.equal(2, list.availableBuffers);
    assert.equal(6, list.availableBytes);
    
    assert.equal(true, list.advance());
    assert.equal(buffer3, list.first);
    assert.equal(3, list.numBuffers);
    assert.equal(1, list.availableBuffers);
    assert.equal(3, list.availableBytes);
    
    list.reset();
    assert.equal(buffer1, list.first);
    assert.equal(3, list.numBuffers);
    assert.equal(3, list.availableBuffers);
    assert.equal(9, list.availableBytes);
  });
    
  it('copy', function() {
    let list = new BufferList();
    let buffer = new Uint8Array(3);
    list.append(buffer);

    let copy = list.copy();

    assert.equal(1, list.numBuffers, copy.numBuffers);
    assert.equal(list.availableBuffers, copy.availableBuffers);
    assert.equal(list.availableBytes, copy.availableBytes);
    assert.equal(list.first, copy.first);
  });
});
