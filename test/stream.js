import {BufferList, Stream, UnderflowError} from '../';
import assert from 'assert';

describe('stream', function() {
  let makeStream = function(...arrays) {
    let list = new BufferList();
  
    for (let i = 0; i < arrays.length; i++) {
      let array = arrays[i];
      list.append(new Uint8Array(array));
    }
    
    return new Stream(list);
  };
    
  it('copy', function() {
    let stream = makeStream([10, 160], [20, 29, 119]);
    let copy = stream.copy();
    
    assert.notEqual(copy, stream);
    assert.deepEqual(copy, stream);
  });
    
  it('advance', function() {
    let stream = makeStream([10, 160], [20, 29, 119]);
    assert.equal(0, stream.offset);
    
    stream.advance(2);
    assert.equal(2, stream.offset);
    
    assert.throws(() => stream.advance(10)
    , UnderflowError);
  });
    
  it('rewind', function() {
    let stream = makeStream([10, 160], [20, 29, 119]);
    
    stream.advance(4);
    assert.equal(4, stream.offset);
    assert.equal(2, stream.localOffset);
    
    stream.rewind(2);
    assert.equal(2, stream.offset);
    assert.equal(0, stream.localOffset);
    
    stream.rewind(1);
    assert.equal(1, stream.offset);
    assert.equal(1, stream.localOffset);
    
    stream.advance(3);
    assert.equal(4, stream.offset);
    assert.equal(2, stream.localOffset);
    
    stream.rewind(4);
    assert.equal(0, stream.offset);
    assert.equal(0, stream.localOffset);
    
    stream.advance(5);
    stream.rewind(4);
    assert.equal(1, stream.offset);
    assert.equal(1, stream.localOffset);
    
    assert.throws(() => stream.rewind(10)
    , UnderflowError);
  });
    
  it('seek', function() {
    let stream = makeStream([10, 160], [20, 29, 119]);
    
    stream.seek(3);
    assert.equal(3, stream.offset);
    assert.equal(1, stream.localOffset);
    
    stream.seek(1);
    assert.equal(1, stream.offset);
    assert.equal(1, stream.localOffset);
    
    assert.throws(() => stream.seek(100), UnderflowError);
    
    assert.throws(() => stream.seek(-10), UnderflowError);
  });
    
  it('remainingBytes', function() {
    let stream = makeStream([10, 160], [20, 29, 119]);
    assert.equal(5, stream.remainingBytes());
    
    stream.advance(2);
    assert.equal(3, stream.remainingBytes());
  });
    
  it('buffer', function() {
    let stream = makeStream([10, 160], [20, 29, 119]);
    assert.deepEqual(new Uint8Array([10, 160, 20, 29]), stream.peekBuffer(0, 4));
    assert.deepEqual(new Uint8Array([160, 20, 29, 119]), stream.peekBuffer(1, 4));
    assert.deepEqual(new Uint8Array([10, 160, 20, 29]), stream.readBuffer(4));
  });
    
  it('single buffer', function() {
    let stream = makeStream([10, 160], [20, 29, 119]);
    assert.deepEqual(new Uint8Array([10, 160]), stream.peekSingleBuffer(0, 4));
    assert.deepEqual(new Uint8Array([10, 160]), stream.readSingleBuffer(4));
  });

  it('uint8', function() {
    let stream = makeStream([10, 160], [20, 29, 119]);
    let values = [10, 160, 20, 29, 119];

    // check peek with correct offsets across buffers
    for (let i = 0; i < values.length; i++) {
      var value = values[i];
      assert.equal(value, stream.peekUInt8(i));
    }
      
    assert.throws(() => stream.peekUInt8(10)
    , UnderflowError);

    // check reading across buffers
    for (let j = 0; j < values.length; j++) {
      var value = values[j];
      assert.equal(value, stream.readUInt8());
    }
      
    assert.throws(() => stream.readUInt8()
    , UnderflowError);

    // if it were a signed int, would be -1
    stream = makeStream([255, 23]);
    assert.equal(255, stream.readUInt8());
  });
    
  it('int8', function() {
    let stream = makeStream([0x23, 0xff, 0x87], [0xab, 0x7c, 0xef]);
    let values = [0x23, -1, -121, -85, 124, -17];

    // peeking
    for (let i = 0; i < values.length; i++) {
      var value = values[i];
      assert.equal(value, stream.peekInt8(i));
    }

    // reading
    for (let j = 0; j < values.length; j++) {
      var value = values[j];
      assert.equal(value, stream.readInt8());
    }
      
    return;
  });
      
  it('uint16', function() {
    let stream = makeStream([0, 0x23, 0x42], [0x3f]);
    let copy = stream.copy();

    // peeking big endian
    let iterable = [0x23, 0x2342, 0x423f];
    for (var i = 0; i < iterable.length; i++) {
      var value = iterable[i];
      assert.equal(value, stream.peekUInt16(i));
    }

    // peeking little endian
    let iterable1 = [0x2300, 0x4223, 0x3f42];
    for (var i = 0; i < iterable1.length; i++) {
      var value = iterable1[i];
      assert.equal(value, stream.peekUInt16(i, true));
    }

    // reading big endian
    let iterable2 = [0x23, 0x423f];
    for (let j = 0; j < iterable2.length; j++) {
      var value = iterable2[j];
      assert.equal(value, stream.readUInt16());
    }

    // reading little endian
    let iterable3 = [0x2300, 0x3f42];
    for (let k = 0; k < iterable3.length; k++) {
      var value = iterable3[k];
      assert.equal(value, copy.readUInt16(true));
    }

    // check that it interprets as unsigned
    stream = makeStream([0xfe, 0xfe]);
    assert.equal(0xfefe, stream.peekUInt16(0));
    assert.equal(0xfefe, stream.peekUInt16(0, true));
  });
    
  it('int16', function() {
    let stream = makeStream([0x16, 0x79, 0xff], [0x80]);
    let copy = stream.copy();

    // peeking big endian
    let iterable = [0x1679, -128];
    for (var i = 0; i < iterable.length; i++) {
      var value = iterable[i];
      assert.equal(value, stream.peekInt16(i * 2));
    }

    // peeking little endian
    let iterable1 = [0x7916, -32513];
    for (var i = 0; i < iterable1.length; i++) {
      var value = iterable1[i];
      assert.equal(value, stream.peekInt16(i * 2, true));
    }

    // reading big endian
    let iterable2 = [0x1679, -128];
    for (let j = 0; j < iterable2.length; j++) {
      var value = iterable2[j];
      assert.equal(value, stream.readInt16());
    }

    // reading little endian
    let iterable3 = [0x7916, -32513];
    for (var i = 0; i < iterable3.length; i++) {
      var value = iterable3[i];
      assert.equal(value, copy.readInt16(true));
    }
      
    return;
  });
      
  it('uint24', function() {
    let stream = makeStream([0x23, 0x16], [0x56, 0x11, 0x78, 0xaf]);
    let copy = stream.copy();

    // peeking big endian
    let iterable = [0x231656, 0x165611, 0x561178, 0x1178af];
    for (var i = 0; i < iterable.length; i++) {
      var value = iterable[i];
      assert.equal(value, stream.peekUInt24(i));
    }

    // peeking little endian
    let iterable1 = [0x561623, 0x115616, 0x781156, 0xaf7811];
    for (var i = 0; i < iterable1.length; i++) {
      var value = iterable1[i];
      assert.equal(value, stream.peekUInt24(i, true));
    }

    // reading big endian
    let iterable2 = [0x231656, 0x1178af];
    for (let j = 0; j < iterable2.length; j++) {
      var value = iterable2[j];
      assert.equal(value, stream.readUInt24());
    }

    let iterable3 = [0x561623, 0xaf7811];
    for (let k = 0; k < iterable3.length; k++) {
      var value = iterable3[k];
      assert.equal(value, copy.readUInt24(true));
    }
      
    return;
  });
      
  it('int24', function() {
    let stream = makeStream([0x23, 0x16, 0x56], [0xff, 0x10, 0xfa]);
    let copy = stream.copy();

    // peeking big endian
    let iterable = [0x231656, 0x1656ff, 0x56ff10, -61190];
    for (var i = 0; i < iterable.length; i++) {
      var value = iterable[i];
      assert.equal(value, stream.peekInt24(i));
    }

    // peeking little endian
    let iterable1 = [0x561623, -43498, 0x10ff56, -388865];
    for (var i = 0; i < iterable1.length; i++) {
      var value = iterable1[i];
      assert.equal(value, stream.peekInt24(i, true));
    }

    // reading big endian
    let iterable2 = [0x231656, -61190];
    for (let j = 0; j < iterable2.length; j++) {
      var value = iterable2[j];
      assert.equal(value, stream.readInt24());
    }

    // reading little endian
    let iterable3 = [0x561623, -388865];
    for (let k = 0; k < iterable3.length; k++) {
      var value = iterable3[k];
      assert.equal(value, copy.readInt24(true));
    }
      
    return;
  });
      
  it('uint32', function() {
    let stream = makeStream([0x32, 0x65, 0x42], [0x56, 0x23], [0xff, 0x45, 0x11]);
    let copy = stream.copy();

    // peeking big endian
    let iterable = [0x32654256, 0x65425623, 0x425623ff, 0x5623ff45, 0x23ff4511];
    for (var i = 0; i < iterable.length; i++) {
      var value = iterable[i];
      assert.equal(value, stream.peekUInt32(i));
    }

    // peeking little endian
    let iterable1 = [0x56426532, 0x23564265, 0xff235642, 0x45ff2356, 0x1145ff23];
    for (var i = 0; i < iterable1.length; i++) {
      var value = iterable1[i];
      assert.equal(value, stream.peekUInt32(i, true));
    }

    // reading big endian
    let iterable2 = [0x32654256, 0x23ff4511];
    for (let j = 0; j < iterable2.length; j++) {
      var value = iterable2[j];
      assert.equal(value, stream.readUInt32());
    }

    // reading little endian
    let iterable3 = [0x56426532, 0x1145ff23];
    for (let k = 0; k < iterable3.length; k++) {
      var value = iterable3[k];
      assert.equal(value, copy.readUInt32(true));
    }
      
    return;
  });
      
  it('int32', function() {
    let stream = makeStream([0x43, 0x53], [0x16, 0x79, 0xff, 0xfe], [0xef, 0xfa]);
    let copy = stream.copy();

    let stream2 = makeStream([0x42, 0xc3, 0x95], [0xa9, 0x36, 0x17]);
    let copy2 = stream2.copy();

    // peeking big endian
    let iterable = [0x43531679, -69638];
    for (var i = 0; i < iterable.length; i++) {
      var value = iterable[i];
      assert.equal(value, stream.peekInt32(i * 4));
    }

    let iterable1 = [0x42c395a9, -1013601994, -1784072681];
    for (var i = 0; i < iterable1.length; i++) {
      var value = iterable1[i];
      assert.equal(value, stream2.peekInt32(i));
    }

    // peeking little endian
    let iterable2 = [0x79165343, -84934913];
    for (var i = 0; i < iterable2.length; i++) {
      var value = iterable2[i];
      assert.equal(value, stream.peekInt32(i * 4, true));
    }

    let iterable3 = [-1449802942, 917083587, 389458325];
    for (var i = 0; i < iterable3.length; i++) {
      var value = iterable3[i];
      assert.equal(value, stream2.peekInt32(i, true));
    }

    // reading big endian
    let iterable4 = [0x43531679, -69638];
    for (let j = 0; j < iterable4.length; j++) {
      var value = iterable4[j];
      assert.equal(value, stream.readInt32());
    }

    // reading little endian
    let iterable5 = [0x79165343, -84934913];
    for (let k = 0; k < iterable5.length; k++) {
      var value = iterable5[k];
      assert.equal(value, copy.readInt32(true));
    }

    stream = makeStream([0xff, 0xff, 0xff, 0xff]);
    assert.equal(-1, stream.peekInt32());
    assert.equal(-1, stream.peekInt32(0, true));
  });
    
  it('float32', function() {
    let stream = makeStream([0, 0, 0x80], [0x3f, 0, 0, 0, 0xc0], [0xab, 0xaa], 
              [0xaa, 0x3e, 0, 0, 0, 0], [0, 0, 0], [0x80, 0, 0, 0x80], [0x7f, 0, 0, 0x80, 0xff]);
    let copy = stream.copy();

    let valuesBE = [4.600602988224807e-41, 2.6904930515036488e-43, -1.2126478207002966e-12, 0, 1.793662034335766e-43, 4.609571298396486e-41, 4.627507918739843e-41];
    let valuesLE = [1, -2, 0.3333333432674408, 0, 0, Infinity, -Infinity];

    // peeking big endian
    for (var i = 0; i < valuesBE.length; i++) {
      var value = valuesBE[i];
      assert.equal(value, stream.peekFloat32(i * 4));
    }

    // peeking little endian
    for (var i = 0; i < valuesLE.length; i++) {
      var value = valuesLE[i];
      assert.equal(value, stream.peekFloat32(i * 4, true));
    }

    // reading big endian
    for (let j = 0; j < valuesBE.length; j++) {
      var value = valuesBE[j];
      assert.equal(value, stream.readFloat32());
    }

    // reading little endian
    for (let k = 0; k < valuesLE.length; k++) {
      var value = valuesLE[k];
      assert.equal(value, copy.readFloat32(true));
    }

    // special cases
    let stream2 = makeStream([0xff, 0xff, 0x7f, 0x7f]);
    assert.ok(isNaN(stream2.peekFloat32(0)));
    assert.equal(3.4028234663852886e+38, stream2.peekFloat32(0, true));
  });
    
  it('float64', function() {
    let stream = makeStream([0x55, 0x55, 0x55, 0x55, 0x55, 0x55], [0xd5, 0x3f]);
    let copy = stream.copy();
    assert.equal(1.1945305291680097e+103, stream.peekFloat64(0));
    assert.equal(0.3333333333333333, stream.peekFloat64(0, true));
    assert.equal(1.1945305291680097e+103, stream.readFloat64());
    assert.equal(0.3333333333333333, copy.readFloat64(true));

    stream = makeStream([1, 0, 0, 0, 0, 0], [0xf0, 0x3f]);
    copy = stream.copy();
    assert.equal(7.291122019655968e-304, stream.peekFloat64(0));
    assert.equal(1.0000000000000002, stream.peekFloat64(0, true));
    assert.equal(7.291122019655968e-304, stream.readFloat64());
    assert.equal(1.0000000000000002, copy.readFloat64(true));

    stream = makeStream([2, 0, 0, 0, 0, 0], [0xf0, 0x3f]);
    copy = stream.copy();
    assert.equal(4.778309726801735e-299, stream.peekFloat64(0));
    assert.equal(1.0000000000000004, stream.peekFloat64(0, true));
    assert.equal(4.778309726801735e-299, stream.readFloat64());
    assert.equal(1.0000000000000004, copy.readFloat64(true));

    stream = makeStream([0xff, 0xff, 0xff, 0xff, 0xff, 0xff], [0x0f, 0x00]);
    copy = stream.copy();
    assert.ok(isNaN(stream.peekFloat64(0)));
    assert.equal(2.225073858507201e-308, stream.peekFloat64(0, true));
    assert.ok(isNaN(stream.readFloat64()));
    assert.equal(2.225073858507201e-308, copy.readFloat64(true));

    stream = makeStream([0xff, 0xff, 0xff, 0xff, 0xff, 0xff], [0xef, 0x7f]);
    copy = stream.copy();
    assert.ok(isNaN(stream.peekFloat64(0)));
    assert.equal(1.7976931348623157e+308, stream.peekFloat64(0, true));
    assert.ok(isNaN(stream.readFloat64()));
    assert.equal(1.7976931348623157e+308, copy.readFloat64(true));

    stream = makeStream([0, 0, 0, 0, 0, 0], [0xf0, 0x3f]);
    copy = stream.copy();
    assert.equal(3.03865e-319, stream.peekFloat64(0));
    assert.equal(1, stream.peekFloat64(0, true));
    assert.equal(3.03865e-319, stream.readFloat64());
    assert.equal(1, copy.readFloat64(true));

    stream = makeStream([0, 0, 0, 0, 0, 0], [0x10, 0]);
    copy = stream.copy();
    assert.equal(2.0237e-320, stream.peekFloat64(0));
    assert.equal(2.2250738585072014e-308, stream.peekFloat64(0, true));
    assert.equal(2.0237e-320, stream.readFloat64());
    assert.equal(2.2250738585072014e-308, copy.readFloat64(true));

    stream = makeStream([0, 0, 0, 0, 0, 0], [0, 0]);
    copy = stream.copy();
    assert.equal(0, stream.peekFloat64(0));
    assert.equal(0, stream.peekFloat64(0, true));
    assert.equal(false, 1 / stream.peekFloat64(0, true) < 0);
    assert.equal(0, stream.readFloat64());
    assert.equal(0, copy.readFloat64(true));

    stream = makeStream([0, 0, 0, 0, 0, 0], [0, 0x80]);
    copy = stream.copy();
    assert.equal(6.3e-322, stream.peekFloat64(0));
    assert.equal(0, stream.peekFloat64(0, true));
    assert.equal(true, 1 / stream.peekFloat64(0, true) < 0);
    assert.equal(6.3e-322, stream.readFloat64());
    assert.equal(0, copy.readFloat64(true));

    stream = makeStream([0, 0, 0, 0, 0, 0], [0xf0, 0x7f]);
    copy = stream.copy();
    assert.equal(3.0418e-319, stream.peekFloat64(0));
    assert.equal(Infinity, stream.peekFloat64(0, true));
    assert.equal(3.0418e-319, stream.readFloat64());
    assert.equal(Infinity, copy.readFloat64(true));

    stream = makeStream([0, 0, 0, 0, 0, 0], [0xf0, 0xff]);
    copy = stream.copy();
    assert.equal(3.04814e-319, stream.peekFloat64(0));
    assert.equal(-Infinity, stream.peekFloat64(0, true));
    assert.equal(3.04814e-319, stream.readFloat64());
    assert.equal(-Infinity, copy.readFloat64(true));
  });
    
  it('float80', function() {
    let stream = makeStream([0x3f, 0xff, 0x80, 0x00, 0x00, 0x00], [0x00, 0x00, 0x00, 0x00]);
    let copy = stream.copy();
    assert.equal(1, stream.peekFloat80());
    assert.equal(0, stream.peekFloat80(0, true));
    assert.equal(1, stream.readFloat80());
    assert.equal(0, copy.readFloat80(true));
    
    stream = makeStream([0x00, 0x00, 0x00], [0x00, 0x00, 0x00, 0x00, 0x80, 0xff, 0x3f]);
    assert.equal(1, stream.peekFloat80(0, true));
    assert.equal(1, stream.readFloat80(true));
    
    stream = makeStream([0xbf, 0xff, 0x80, 0x00, 0x00, 0x00], [0x00, 0x00, 0x00, 0x00]);
    copy = stream.copy();
    assert.equal(-1, stream.peekFloat80());
    assert.equal(0, stream.peekFloat80(0, true));
    assert.equal(-1, stream.readFloat80());
    assert.equal(0, copy.readFloat80(true));
    
    stream = makeStream([0x00, 0x00, 0x00], [0x00, 0x00, 0x00, 0x00, 0x80, 0xff, 0xbf]);
    assert.equal(-1, stream.peekFloat80(0, true));
    assert.equal(-1, stream.readFloat80(true));
    
    stream = makeStream([0x40, 0x0e, 0xac, 0x44, 0, 0, 0, 0, 0, 0]);
    copy = stream.copy();
    assert.equal(44100, stream.peekFloat80());
    assert.equal(0, stream.peekFloat80(0, true));
    assert.equal(44100, stream.readFloat80());
    assert.equal(0, copy.readFloat80(true));
    
    stream = makeStream([0, 0, 0, 0, 0, 0, 0x44, 0xac, 0x0e, 0x40]);
    assert.equal(44100, stream.peekFloat80(0, true));
    assert.equal(44100, stream.readFloat80(true));
    
    stream = makeStream([0x7f, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    copy = stream.copy();
    assert.equal(Infinity, stream.peekFloat80());
    assert.equal(0, stream.peekFloat80(0, true));
    assert.equal(Infinity, stream.readFloat80());
    assert.equal(0, copy.readFloat80(true));
    
    stream = makeStream([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0x7f]);
    assert.equal(Infinity, stream.peekFloat80(0, true));
    assert.equal(Infinity, stream.readFloat80(true));
    
    stream = makeStream([0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    assert.equal(-Infinity, stream.peekFloat80());
    assert.equal(-Infinity, stream.readFloat80());
    
    stream = makeStream([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff]);
    assert.equal(-Infinity, stream.peekFloat80(0, true));
    assert.equal(-Infinity, stream.readFloat80(true));
    
    stream = makeStream([0x7f, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    assert.ok(isNaN(stream.peekFloat80()));
    assert.ok(isNaN(stream.readFloat80()));
    
    stream = makeStream([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0x7f]);
    assert.ok(isNaN(stream.peekFloat80(0, true)));
    assert.ok(isNaN(stream.readFloat80(true)));
    
    stream = makeStream([0x40, 0x00, 0xc9, 0x0f, 0xda, 0x9e, 0x46, 0xa7, 0x88, 0x00]);
    assert.equal(3.14159265, stream.peekFloat80());
    assert.equal(3.14159265, stream.readFloat80());
    
    stream = makeStream([0x00, 0x88, 0xa7, 0x46, 0x9e, 0xda, 0x0f, 0xc9, 0x00, 0x40]);
    assert.equal(3.14159265, stream.peekFloat80(0, true));
    assert.equal(3.14159265, stream.readFloat80(true));
    
    stream = makeStream([0x3f, 0xfd, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xa8, 0xff]);
    copy = stream.copy();
    assert.equal(0.3333333333333333, stream.peekFloat80());
    assert.equal(-Infinity, stream.peekFloat80(0, true));
    assert.equal(0.3333333333333333, stream.readFloat80());
    assert.equal(-Infinity, copy.readFloat80(true));
    
    stream = makeStream([0x41, 0x55, 0xaa, 0xaa, 0xaa, 0xaa, 0xae, 0xa9, 0xf8, 0x00]);
    assert.equal(1.1945305291680097e+103, stream.peekFloat80());
    assert.equal(1.1945305291680097e+103, stream.readFloat80());
  });
    
  it('ascii/latin1', function() {
    let stream = makeStream([0x68, 0x65, 0x6c, 0x6c, 0x6f]);
    assert.equal('hello', stream.peekString(0, 5));
    assert.equal('hello', stream.peekString(0, 5, 'ascii'));
    assert.equal('hello', stream.peekString(0, 5, 'latin1'));
    assert.equal('hello', stream.readString(5, 'ascii'));
    assert.equal(5, stream.offset);
  });

  it('ascii/latin1 null terminated', function() {
    let stream = makeStream([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0]);
    assert.equal('hello\0', stream.peekString(0, 6));
    assert.equal('hello', stream.peekString(0, null));
    assert.equal('hello', stream.readString(null));
    assert.equal(6, stream.offset);
  });

  it('utf8', function() {
    let stream = makeStream([195, 188, 98, 101, 114]);
    assert.equal('über', stream.peekString(0, 5, 'utf8'));
    assert.equal('über', stream.readString(5, 'utf8'));
    assert.equal(5, stream.offset);

    stream = makeStream([0xc3, 0xb6, 0xe6, 0x97, 0xa5, 0xe6, 0x9c, 0xac, 0xe8, 0xaa, 0x9e]);
    assert.equal('ö日本語', stream.peekString(0, 11, 'utf8'));
    assert.equal('ö日本語', stream.readString(11, 'utf8'));
    assert.equal(11, stream.offset);

    stream = makeStream([0xf0, 0x9f, 0x91, 0x8d]);
    assert.equal('👍', stream.peekString(0, 4, 'utf8'));
    assert.equal('👍', stream.readString(4, 'utf8'));
    assert.equal(4, stream.offset);

    stream = makeStream([0xe2, 0x82, 0xac]);
    assert.equal('€', stream.peekString(0, 3, 'utf8'));
    assert.equal('€', stream.readString(3, 'utf8'));
    assert.equal(3, stream.offset);
  });

  it('utf-8 null terminated', function() {
    let stream = makeStream([195, 188, 98, 101, 114, 0]);
    assert.equal('über', stream.peekString(0, null, 'utf-8'));
    assert.equal('über', stream.readString(null, 'utf-8'));
    assert.equal(6, stream.offset);

    stream = makeStream([0xc3, 0xb6, 0xe6, 0x97, 0xa5, 0xe6, 0x9c, 0xac, 0xe8, 0xaa, 0x9e, 0]);
    assert.equal('ö日本語', stream.peekString(0, null, 'utf8'));
    assert.equal('ö日本語', stream.readString(null, 'utf8'));
    assert.equal(12, stream.offset);

    stream = makeStream([0xf0, 0x9f, 0x91, 0x8d, 0]);
    assert.equal('👍', stream.peekString(0, null, 'utf8'));
    assert.equal('👍', stream.readString(null, 'utf8'));
    assert.equal(5, stream.offset);

    stream = makeStream([0xe2, 0x82, 0xac, 0]);
    assert.equal('€', stream.peekString(0, null, 'utf8'));
    assert.equal('€', stream.readString(null, 'utf8'));
    assert.equal(4, stream.offset);
  });

  it('utf16be', function() {
    let stream = makeStream([0, 252, 0, 98, 0, 101, 0, 114]);
    assert.equal('über', stream.peekString(0, 8, 'utf16be'));
    assert.equal('über', stream.readString(8, 'utf16be'));
    assert.equal(8, stream.offset);

    stream = makeStream([4, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66]);
    assert.equal('привет', stream.peekString(0, 12, 'utf16be'));
    assert.equal('привет', stream.readString(12, 'utf16be'));
    assert.equal(12, stream.offset);

    stream = makeStream([0, 0xf6, 0x65, 0xe5, 0x67, 0x2c, 0x8a, 0x9e]);
    assert.equal('ö日本語', stream.peekString(0, 8, 'utf16be'));
    assert.equal('ö日本語', stream.readString(8, 'utf16be'));
    assert.equal(8, stream.offset);

    stream = makeStream([0xd8, 0x3d, 0xdc, 0x4d]);
    assert.equal('👍', stream.peekString(0, 4, 'utf16be'));
    assert.equal('👍', stream.readString(4, 'utf16be'));
    assert.equal(4, stream.offset);
  });

  it('utf16-be null terminated', function() {
    let stream = makeStream([0, 252, 0, 98, 0, 101, 0, 114, 0, 0]);
    assert.equal('über', stream.peekString(0, null, 'utf16-be'));
    assert.equal('über', stream.readString(null, 'utf16-be'));
    assert.equal(10, stream.offset);

    stream = makeStream([4, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 0, 0]);
    assert.equal('привет', stream.peekString(0, null, 'utf16be'));
    assert.equal('привет', stream.readString(null, 'utf16be'));
    assert.equal(14, stream.offset);

    stream = makeStream([0, 0xf6, 0x65, 0xe5, 0x67, 0x2c, 0x8a, 0x9e, 0, 0]);
    assert.equal('ö日本語', stream.peekString(0, null, 'utf16be'));
    assert.equal('ö日本語', stream.readString(null, 'utf16be'));
    assert.equal(10, stream.offset);

    stream = makeStream([0xd8, 0x3d, 0xdc, 0x4d, 0, 0]);
    assert.equal('👍', stream.peekString(0, null, 'utf16be'));
    assert.equal('👍', stream.readString(null, 'utf16be'));
    assert.equal(6, stream.offset);
  });

  it('utf16le', function() {
    let stream = makeStream([252, 0, 98, 0, 101, 0, 114, 0]);
    assert.equal('über', stream.peekString(0, 8, 'utf16le'));
    assert.equal('über', stream.readString(8, 'utf16le'));
    assert.equal(8, stream.offset);

    stream = makeStream([63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 4]);
    assert.equal('привет', stream.peekString(0, 12, 'utf16le'));
    assert.equal('привет', stream.readString(12, 'utf16le'));
    assert.equal(12, stream.offset);

    stream = makeStream([0xf6, 0, 0xe5, 0x65, 0x2c, 0x67, 0x9e, 0x8a]);
    assert.equal('ö日本語', stream.peekString(0, 8, 'utf16le'));
    assert.equal('ö日本語', stream.readString(8, 'utf16le'));
    assert.equal(8, stream.offset);

    stream = makeStream([0x42, 0x30, 0x44, 0x30, 0x46, 0x30, 0x48, 0x30, 0x4a, 0x30]);
    assert.equal('あいうえお', stream.peekString(0, 10, 'utf16le'));
    assert.equal('あいうえお', stream.readString(10, 'utf16le'));
    assert.equal(10, stream.offset);

    stream = makeStream([0x3d, 0xd8, 0x4d, 0xdc]);
    assert.equal('👍', stream.peekString(0, 4, 'utf16le'));
    assert.equal('👍', stream.readString(4, 'utf16le'));
    assert.equal(4, stream.offset);
  });

  it('utf16-le null terminated', function() {
    let stream = makeStream([252, 0, 98, 0, 101, 0, 114, 0, 0, 0]);
    assert.equal('über', stream.peekString(0, null, 'utf16-le'));
    assert.equal('über', stream.readString(null, 'utf16-le'));
    assert.equal(10, stream.offset);

    stream = makeStream([63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 4, 0, 0]);
    assert.equal('привет', stream.peekString(0, null, 'utf16le'));
    assert.equal('привет', stream.readString(null, 'utf16le'));
    assert.equal(14, stream.offset);

    stream = makeStream([0xf6, 0, 0xe5, 0x65, 0x2c, 0x67, 0x9e, 0x8a, 0, 0]);
    assert.equal('ö日本語', stream.peekString(0, null, 'utf16le'));
    assert.equal('ö日本語', stream.readString(null, 'utf16le'));
    assert.equal(10, stream.offset);

    stream = makeStream([0x42, 0x30, 0x44, 0x30, 0x46, 0x30, 0x48, 0x30, 0x4a, 0x30, 0, 0]);
    assert.equal('あいうえお', stream.peekString(0, null, 'utf16le'));
    assert.equal('あいうえお', stream.readString(null, 'utf16le'));
    assert.equal(12, stream.offset);

    stream = makeStream([0x3d, 0xd8, 0x4d, 0xdc, 0, 0]);
    assert.equal('👍', stream.peekString(0, null, 'utf16le'));
    assert.equal('👍', stream.readString(null, 'utf16le'));
    assert.equal(6, stream.offset);
  });

  it('utf16bom big endian', function() {
    let stream = makeStream([0xfe, 0xff, 0, 252, 0, 98, 0, 101, 0, 114]);
    assert.equal('über', stream.peekString(0, 10, 'utf16bom'));
    assert.equal('über', stream.readString(10, 'utf16bom'));
    assert.equal(10, stream.offset);

    stream = makeStream([0xfe, 0xff, 4, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66]);
    assert.equal('привет', stream.peekString(0, 14, 'utf16bom'));
    assert.equal('привет', stream.readString(14, 'utf16bom'));
    assert.equal(14, stream.offset);

    stream = makeStream([0xfe, 0xff, 0, 0xf6, 0x65, 0xe5, 0x67, 0x2c, 0x8a, 0x9e]);
    assert.equal('ö日本語', stream.peekString(0, 10, 'utf16bom'));
    assert.equal('ö日本語', stream.readString(10, 'utf16bom'));
    assert.equal(10, stream.offset);

    stream = makeStream([0xfe, 0xff, 0xd8, 0x3d, 0xdc, 0x4d]);
    assert.equal('👍', stream.peekString(0, 6, 'utf16bom'));
    assert.equal('👍', stream.readString(6, 'utf16bom'));
    assert.equal(6, stream.offset);
  });

  it('utf16-bom big endian, null terminated', function() {
    let stream = makeStream([0xfe, 0xff, 0, 252, 0, 98, 0, 101, 0, 114, 0, 0]);
    assert.equal('über', stream.peekString(0, null, 'utf16-bom'));
    assert.equal('über', stream.readString(null, 'utf16-bom'));
    assert.equal(12, stream.offset);

    stream = makeStream([0xfe, 0xff, 4, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 0, 0]);
    assert.equal('привет', stream.peekString(0, null, 'utf16-bom'));
    assert.equal('привет', stream.readString(null, 'utf16-bom'));
    assert.equal(16, stream.offset);

    stream = makeStream([0xfe, 0xff, 0, 0xf6, 0x65, 0xe5, 0x67, 0x2c, 0x8a, 0x9e, 0, 0]);
    assert.equal('ö日本語', stream.peekString(0, null, 'utf16bom'));
    assert.equal('ö日本語', stream.readString(null, 'utf16bom'));
    assert.equal(12, stream.offset);

    stream = makeStream([0xfe, 0xff, 0xd8, 0x3d, 0xdc, 0x4d, 0, 0]);
    assert.equal('👍', stream.peekString(0, null, 'utf16bom'));
    assert.equal('👍', stream.readString(null, 'utf16bom'));
    assert.equal(8, stream.offset);
  });

  it('utf16bom little endian', function() {
    let stream = makeStream([0xff, 0xfe, 252, 0, 98, 0, 101, 0, 114, 0]);
    assert.equal('über', stream.peekString(0, 10, 'utf16bom'));
    assert.equal('über', stream.readString(10, 'utf16bom'));
    assert.equal(10, stream.offset);

    stream = makeStream([0xff, 0xfe, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 4]);
    assert.equal('привет', stream.peekString(0, 14, 'utf16bom'));
    assert.equal('привет', stream.readString(14, 'utf16bom'));
    assert.equal(14, stream.offset);

    stream = makeStream([0xff, 0xfe, 0xf6, 0, 0xe5, 0x65, 0x2c, 0x67, 0x9e, 0x8a]);
    assert.equal('ö日本語', stream.peekString(0, 10, 'utf16bom'));
    assert.equal('ö日本語', stream.readString(10, 'utf16bom'));
    assert.equal(10, stream.offset);

    stream = makeStream([0xff, 0xfe, 0x3d, 0xd8, 0x4d, 0xdc]);
    assert.equal('👍', stream.peekString(0, 6, 'utf16bom'));
    assert.equal('👍', stream.readString(6, 'utf16bom'));
    assert.equal(6, stream.offset);
  });

  it('utf16-bom little endian, null terminated', function() {
    let stream = makeStream([0xff, 0xfe, 252, 0, 98, 0, 101, 0, 114, 0, 0, 0]);
    assert.equal('über', stream.peekString(0, null, 'utf16-bom'));
    assert.equal('über', stream.readString(null, 'utf16-bom'));
    assert.equal(12, stream.offset);

    stream = makeStream([0xff, 0xfe, 63, 4, 64, 4, 56, 4, 50, 4, 53, 4, 66, 4, 0, 0]);
    assert.equal('привет', stream.peekString(0, null, 'utf16bom'));
    assert.equal('привет', stream.readString(null, 'utf16bom'));
    assert.equal(16, stream.offset);

    stream = makeStream([0xff, 0xfe, 0xf6, 0, 0xe5, 0x65, 0x2c, 0x67, 0x9e, 0x8a, 0, 0]);
    assert.equal('ö日本語', stream.peekString(0, null, 'utf16bom'));
    assert.equal('ö日本語', stream.readString(null, 'utf16bom'));
    assert.equal(12, stream.offset);

    stream = makeStream([0xff, 0xfe, 0x3d, 0xd8, 0x4d, 0xdc, 0, 0]);
    assert.equal('👍', stream.peekString(0, null, 'utf16bom'));
    assert.equal('👍', stream.readString(null, 'utf16bom'));
    assert.equal(8, stream.offset);
  });
});
