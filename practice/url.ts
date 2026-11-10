const url = new URL('https://example.com/hello/world?param1=hello&param2=42#hello-tag');

const searchParams = Object.fromEntries(url.searchParams.entries());
const param1 = url.searchParams.get('param1');
const hash = url.hash;

console.log({
    url,
    searchParams,
    param1,
    hash,
});
