const textBuffer = Buffer.from('Hello world');

console.log({
    textBuffer,
    text: textBuffer.toString('utf-8'),
    length: textBuffer.length,
});

const fixedBuffer = Buffer.alloc(5);

console.log('Empty fixed buffer:', fixedBuffer);
