const { request: httpRequest } = require('http');
const { request: httpsRequest } = require('https');
const { URL } = require('url');

// Load .env.local if present
function loadDotEnv(filePath) {
  try {
    const fs = require('fs');
    const src = fs.readFileSync(filePath, 'utf8');
    const lines = src.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (err) {
    // no-op
  }
}

const path = require('path');
loadDotEnv(path.resolve(__dirname, '..', '.env.local'));

// Configuration
const ADMIN_USERNAME = process.env.HARPERDB_USERNAME || 'HDB_ADMIN';
const ADMIN_PASSWORD = process.env.HARPERDB_PASSWORD || 'changeme';
const CLUSTER_USER = process.env.CLUSTERING_USER || 'cluster_user';
const CLUSTER_PASSWORD = process.env.CLUSTERING_PASSWORD || 'cluster_pass_123';
const SCHEMA = process.env.HARPERDB_SCHEMA || 'cheatercheck';
const TABLE = process.env.HARPERDB_TABLE || 'signals';

// Node configuration - can be overridden via environment
const NODES = process.env.CLUSTER_NODES 
  ? JSON.parse(process.env.CLUSTER_NODES)
  : [
      { name: 'Node1', url: 'http://localhost:9925', host: 'node-1-hdb', port: 9925 },
      { name: 'Node2', url: 'http://localhost:9927', host: 'node-2-hdb', port: 9925 },
      { name: 'Node3', url: 'http://localhost:9929', host: 'node-3-hdb', port: 9925 },
    ];

// Use first node as the bootstrap node
const BOOTSTRAP_NODE = NODES[0];

function post(url, body, headers) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const opts = {
        method: 'POST',
        hostname: u.hostname,
        path: u.pathname || '/',
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        headers: headers,
        timeout: 10000,
      };

      const req = (u.protocol === 'https:' ? httpsRequest : httpRequest)(opts, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const txt = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, body: txt });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${txt}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function get(url, headers) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const opts = {
        method: 'GET',
        hostname: u.hostname,
        path: u.pathname || '/',
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        headers: headers,
        timeout: 5000,
      };

      const req = (u.protocol === 'https:' ? httpsRequest : httpRequest)(opts, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const txt = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
            resolve({ status: res.statusCode, body: txt });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${txt}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function waitForNode(url, maxAttempts = 30) {
  const auth = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${auth}`,
  };

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await get(url, headers);
      return true;
    } catch (err) {
      if (i < maxAttempts - 1) {
        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw err;
      }
    }
  }
  return false;
}

async function executeOperation(url, operation, headers, description) {
  try {
    const res = await post(url, JSON.stringify(operation), headers);
    let result;
    try {
      result = JSON.parse(res.body);
    } catch {
      result = res.body;
    }
    console.log(`✓ ${description}`);
    return { success: true, result };
  } catch (err) {
    const msg = String(err.message || '');
    // Check if operation already completed (e.g., node already added)
    if (
      msg.toLowerCase().includes('already') ||
      msg.toLowerCase().includes('exists') ||
      msg.toLowerCase().includes('duplicate')
    ) {
      console.log(`⚠ ${description} - already configured, skipping`);
      return { success: true, skipped: true };
    }
    console.error(`✗ ${description} failed:`, msg);
    return { success: false, error: msg };
  }
}

(async () => {
  console.log('HarperDB Cluster Bootstrap');
  console.log('==========================\n');

  // Wait for all nodes to be ready
  console.log('Waiting for nodes to be ready...');
  for (const node of NODES) {
    process.stdout.write(`  Checking ${node.name} (${node.url})...`);
    try {
      await waitForNode(node.url);
      console.log(' ready');
    } catch (err) {
      console.error(`\n  ✗ ${node.name} not ready:`, err.message);
      console.error('  Make sure all nodes are running: docker-compose up -d');
      process.exit(1);
    }
  }
  console.log('');

  const auth = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${auth}`,
  };

  // Step 1: Create cluster user
  console.log('Step 1: Creating cluster user...');
  const clusterUserOp = {
    operation: 'add_user',
    role: 'cluster_user',
    username: CLUSTER_USER,
    password: CLUSTER_PASSWORD,
    active: true,
  };
  await executeOperation(BOOTSTRAP_NODE.url, clusterUserOp, headers, 'Create cluster user');
  console.log('');

  // Step 2: Add nodes to cluster
  console.log('Step 2: Adding nodes to cluster...');
  for (const node of NODES) {
    if (node.name === BOOTSTRAP_NODE.name) {
      console.log(`  Skipping ${node.name} (bootstrap node)`);
      continue;
    }

    const addNodeOp = {
      operation: 'add_node',
      node_name: node.name,
      host: node.host,
      port: node.port,
    };
    await executeOperation(BOOTSTRAP_NODE.url, addNodeOp, headers, `Add ${node.name} to cluster`);
  }
  console.log('');

  // Step 3: Configure replication subscriptions
  console.log('Step 3: Configuring replication subscriptions...');
  for (const node of NODES) {
    if (node.name === BOOTSTRAP_NODE.name) {
      continue;
    }

    const replicationOp = {
      operation: 'set_node_replication',
      node_name: node.name,
      subscriptions: [
        {
          schema: SCHEMA,
          table: TABLE,
          subscribe: true,
          publish: true,
        },
      ],
    };
    await executeOperation(BOOTSTRAP_NODE.url, replicationOp, headers, `Configure replication for ${node.name}`);
  }
  console.log('');

  // Step 4: Verify cluster status
  console.log('Step 4: Verifying cluster status...');
  try {
    const statusOp = { operation: 'describe_cluster' };
    const res = await post(BOOTSTRAP_NODE.url, JSON.stringify(statusOp), headers);
    const status = JSON.parse(res.body);
    console.log('  Cluster nodes:');
    if (status.cluster_nodes && Array.isArray(status.cluster_nodes)) {
      status.cluster_nodes.forEach(node => {
        console.log(`    - ${node.node_name || node.name}: ${node.status || 'connected'}`);
      });
    } else {
      console.log('    Cluster status:', JSON.stringify(status, null, 2));
    }
  } catch (err) {
    console.log('  Could not retrieve cluster status:', err.message);
  }

  console.log('\n✓ Cluster bootstrap complete!');
  console.log(`\nAccess points:`);
  NODES.forEach((node, idx) => {
    console.log(`  Node ${idx + 1} (${node.name}): http://localhost:${3001 + idx}`);
  });
})();

