import { Readable, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const readableStream = Readable.from(['Hello ', 'world,', 'my name', 'is Mykola']);

const uppercaseTransform = new Transform({
    transform(chunk, _encoding, callback) {
        const text = chunk.toString();

        callback(null, text.toUpperCase());
    },
});

const writableStream = new Writable({
    write(chunk, _encoding, callback) {
        const text = chunk.toString();

        console.log('Chunk recieved: ', text);

        callback(null);
    },
});

const main = async () => {
    try {
        await pipeline(readableStream, uppercaseTransform, writableStream);

        console.log('stream completed');
    } catch (error) {
        console.error('stream error:', (error as Error).message);
    }
};

main();
