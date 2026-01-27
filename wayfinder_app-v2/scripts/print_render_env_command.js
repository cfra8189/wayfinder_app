#!/usr/bin/env node
// Prints a ready-to-run curl command to set an environment variable for an
// existing Render service. This avoids embedding API keys in the repo.
//
// Usage examples:
// 1) Provide values via environment variables and run the script to print the curl:
//    export RENDER_API_KEY=ya...\
//    export RENDER_SERVICE_ID=srv-xxxx\
//    export DATABASE_URL="postgres://..."
//    node scripts/print_render_env_command.js --key DATABASE_URL
//
// 2) Provide value directly on the command line (safer to use env vars):
//    node scripts/print_render_env_command.js --service srv-xxx --key DATABASE_URL --value "postgres://..."

function usage() {
  console.log('Usage: node scripts/print_render_env_command.js [--service SERVICE_ID] --key KEY [--value VALUE]');
  console.log('If --value is omitted the script reads from process.env[KEY].');
}

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--service') opts.service = args[++i];
  else if (args[i] === '--key') opts.key = args[++i];
  else if (args[i] === '--value') opts.value = args[++i];
  else if (args[i] === '--help' || args[i] === '-h') { usage(); process.exit(0); }
}

if (!opts.key) { usage(); process.exit(1); }

const serviceId = opts.service || process.env.RENDER_SERVICE_ID;
const apiKey = process.env.RENDER_API_KEY;
let value = opts.value || process.env[opts.key];

console.log('\nIMPORTANT: This script only prints the curl command.');
console.log('Run the printed command locally — it requires your Render API key.\n');

if (!serviceId) {
  console.log('ERROR: service id not provided.');
  console.log('Supply with --service SERVICE_ID or set RENDER_SERVICE_ID in your environment.');
  process.exit(1);
}

if (!value) {
  console.log(`ERROR: value for key ${opts.key} not provided.`);
  console.log('Provide via --value or set the variable in your environment (e.g. export DATABASE_URL=...)');
  process.exit(1);
}

if (!apiKey) {
  console.log('WARNING: RENDER_API_KEY not set. You will need to supply Authorization header when running the curl command.');
  console.log('You can set it as an env var and re-run to get the command with the header pre-filled.');
}

// Prepare a safe JSON payload. We'll print a curl command that the user can run.
const payload = JSON.stringify({ key: opts.key, value, scope: 'env' });

let cmd = `curl -X POST \
  \"https://api.render.com/v1/services/${serviceId}/env-vars\" \
  -H \"Content-Type: application/json\" \
  -d '${payload}'`;

if (apiKey) {
  // prefer showing a command that uses env var for API key to avoid accidental leakage
  cmd = `RENDER_API_KEY=\"${apiKey}\" \
${cmd} \
  -H \"Authorization: Bearer $RENDER_API_KEY\"`;
} else {
  cmd += ' \n  -H "Authorization: Bearer <YOUR_RENDER_API_KEY>"';
}

console.log('\nCopy and run the following command in your terminal:\n');
console.log(cmd + '\n');

console.log('After running it, trigger a deploy in Render or restart the service so the new env var is picked up.');
