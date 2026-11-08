const textBuffer = Buffer.from('Hello world');

console.log({
    textBuffer,
    text: textBuffer.toString('utf-8'),
    length: textBuffer.length,
});

const fixedBuffer = Buffer.alloc(5);

console.log('Empty fixed buffer:', fixedBuffer);

fixedBuffer.write('12345567');

console.log('Fixed buffer after update:', fixedBuffer);
console.log('Fixed buffer as text:', fixedBuffer.toString('utf-8'));

const chunks = [Buffer.from('Hello '), Buffer.from('world'), Buffer.from('!')];
const combinedBuffer = Buffer.concat(chunks);

console.log(combinedBuffer, combinedBuffer.toString('utf-8'));
