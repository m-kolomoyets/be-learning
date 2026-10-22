import process from "process";

const NODE_ENV = process.env.NODE_ENV ?? 'development';

process.on('exit', code => {
  console.log(`Process finished with exit code ${code}`);
})

const command = process.argv[2] ?? 'start';
const shouldFail = process.argv.includes('--fail');

if (shouldFail) {
  console.error('App failed because of --fail flag');
  process.exit(1);
}
