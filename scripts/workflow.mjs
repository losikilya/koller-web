import { checkChange, ensure } from './workflow-lib.mjs';
try {
  const [command, change] = process.argv.slice(2);
  ensure(['check', 'ready'].includes(command) && change, 'Usage: npm run workflow -- check|ready <change>');
  console.log(JSON.stringify(checkChange(process.cwd(), change, command === 'ready'), null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
