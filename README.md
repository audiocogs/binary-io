# stream-reader

Streaming binary data and bitstream reader. Extracted from [aurora.js](https://github.com/audiocogs/aurora.js).

## BufferList

A `BufferList` is represents a linked list of byte buffers. It manages the current total length of the list and is used by the `Stream` class internally.

## Stream

The `Stream` class represents a stream of binary data backed by a `BufferList`. Streams handle the complexity of reading various types of values from a binary data stream for you, including issues regarding the native endianness of the platform.

## Bitstream

The `Bitstream` class wraps a `Stream` and adds methods to read data on an individual bit level.

## License

MIT
