# binary-io

Streaming byte and bit stream reader and writer. Extracted from [aurora.js](https://github.com/audiocogs/aurora.js).

## BufferList

A `BufferList` is represents a linked list of byte buffers. It manages the current total length of the list and is used by the `Stream` class internally.

## StreamReader

The `StreamReader` class reads a stream of binary data backed by a `BufferList`. `StreamReader` handles the complexity of reading various types of values from a binary data stream for you, including issues regarding the native endianness of the platform.

## BitstreamReader

The `BitstreamReader` class wraps a `StreamReader` and adds methods to read data on an individual bit level.

## StreamWriter

The `StreamWriter` class writes various binary data types to a writable stream.

## BitstreamWriter

The `BitstreamWriter` class wraps a `StreamWriter`, and adds methods to write data on an individual bit level.

## License

MIT
