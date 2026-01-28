const fs = require('fs');
const https = require('https');

function readEnv(path) {
  const txt = fs.readFileSync(path, 'utf8');
  const lines = txt.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m) {
      out[m[1]] = m[2];
    }
  }
  return out;
}

function getJSON(path, apiKey) {
  const options = {
    hostname: 'api.render.com',
    path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data || '{}');
          resolve({ statusCode: res.statusCode, body: j });
        } catch (e) {
          reject(new Error('Invalid JSON from Render: ' + e.message + '\n' + data));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async function main(){
  const projectRoot = __dirname;
  const envPath = projectRoot + '/.env';
  if (!fs.existsSync(envPath)) {
    console.error('No .env found at', envPath);
    process.exit(1);
  }
  const env = readEnv(envPath);
  const API_KEY = env.RENDER_API_KEY;
  const SERVICE_ID = env.RENDER_SERVICE_ID || env.RENDER_SERVICE_ID;
  if (!API_KEY) { console.error('RENDER_API_KEY not found in .env'); process.exit(1); }
  if (!SERVICE_ID) { console.error('RENDER_SERVICE_ID not found in .env'); process.exit(1); }

  console.log('Polling Render for service', SERVICE_ID);

  const maxAttempts = 60;
  const delayMs = 5000;

  for (let i=0;i<maxAttempts;i++){
    try{
      const deploys = await getJSON(`/v1/services/${SERVICE_ID}/deploys?limit=1`, API_KEY);
      // deploys.body should be an array or object
      let state = null;
      let deployId = null;
      if (Array.isArray(deploys.body) && deploys.body.length>0) {
        state = deploys.body[0].state || deploys.body[0].status;
        deployId = deploys.body[0].id || deploys.body[0].deployId || null;
      } else if (deploys.body && deploys.body.deploys && Array.isArray(deploys.body.deploys) && deploys.body.deploys.length>0) {
        state = deploys.body.deploys[0].state || deploys.body.deploys[0].status;
        deployId = deploys.body.deploys[0].id || null;
      }

      const svc = await getJSON(`/v1/services/${SERVICE_ID}`, API_KEY);
      const defaultDomain = svc.body?.service?.defaultDomain || svc.body?.defaultDomain || svc.body?.serviceDetails?.defaultDomain;

      console.log(new Date().toISOString(), 'deploy state=', state, 'deployId=', deployId, 'domain=', defaultDomain || 'unknown');

      if (state === 'live' || state === 'success'){
        console.log('Deploy succeeded. Public URL:', defaultDomain ? `https://${defaultDomain}` : 'Domain not returned');
        process.exit(0);
      }
      if (state === 'failed' || state === 'canceled' || state === 'cancelled'){
        console.error('Deploy failed with state:', state);
        console.error('Full deploy response:', JSON.stringify(deploys.body, null, 2));
        process.exit(2);
      }

    } catch (e){
      console.error('Error querying Render:', e.message);
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  console.error('Timed out waiting for deploy');
  process.exit(3);
})();
