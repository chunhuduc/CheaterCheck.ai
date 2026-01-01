# HarperDB Multi-Node Cluster Deployment

This guide explains how to deploy and manage multiple HarperDB nodes with automatic clustering and data synchronization.

## Architecture

Each node is self-contained and includes:
- **Next.js Application**: Serves the CheaterCheck.ai web interface
- **HarperDB Instance**: Database with clustering enabled

All HarperDB instances automatically sync data through HarperDB's built-in clustering mechanism.

## Quick Start

### 1. Start All Nodes

```bash
npm run cluster:up
```

This starts all 3 nodes defined in `docker-compose.yml`:
- Node 1: http://localhost:3001 (HarperDB: localhost:9925)
- Node 2: http://localhost:3002 (HarperDB: localhost:9927)
- Node 3: http://localhost:3003 (HarperDB: localhost:9929)

### 2. Bootstrap the Cluster

After all nodes are running, configure the cluster:

```bash
npm run cluster:bootstrap
```

This script will:
- Wait for all nodes to be ready
- Create the cluster user account
- Add all nodes to the cluster
- Configure bidirectional replication for the `cheatercheck.signals` table

### 3. Seed Initial Data (Optional)

Seed data on the first node (it will replicate to others):

```bash
npm run cluster:seed
```

## Cluster Management

### View Cluster Status

```bash
npm run cluster:status
```

### View Logs

```bash
npm run cluster:logs
```

View logs for specific services:

```bash
docker-compose logs -f node-1-app
docker-compose logs -f node-1-hdb
```

### Stop All Nodes

```bash
npm run cluster:stop
```

### Stop and Remove All Nodes

```bash
npm run cluster:down
```

## Adding More Nodes

To add additional nodes beyond the default 3:

1. **Edit `docker-compose.yml`** and add a new node definition:

```yaml
  # Node 4
  node-4-app:
    <<: *node-app
    ports:
      - "3004:3000"
    environment:
      HARPERDB_URL: "http://node-4-hdb:9925"
      HARPERDB_USERNAME: "HDB_ADMIN"
      HARPERDB_PASSWORD: "changeme"
      HARPERDB_SCHEMA: "cheatercheck"
      HARPERDB_TABLE: "signals"
    depends_on:
      - node-4-hdb

  node-4-hdb:
    <<: *node-hdb
    ports:
      - "9931:9925"
      - "9932:9926"
      - "9935:9932"
    environment:
      HDB_ADMIN_PASSWORD: "changeme"
      HDB_HTTP_PORT: "9925"
      HDB_ENABLE_AUTO_START: "true"
      CLUSTERING_ENABLED: "true"
      CLUSTERING_USER: "cluster_user"
      CLUSTERING_PASSWORD: "cluster_pass_123"
      CLUSTERING_NODENAME: "Node4"
    volumes:
      - node-4-data:/opt/harperdb/hdb
```

2. **Add volume** in the volumes section:

```yaml
volumes:
  node-1-data:
  node-2-data:
  node-3-data:
  node-4-data:  # Add this
```

3. **Update `scripts/cluster-bootstrap.js`** to include the new node in the `NODES` array, or set the `CLUSTER_NODES` environment variable:

```bash
export CLUSTER_NODES='[{"name":"Node1","url":"http://localhost:9925","host":"node-1-hdb","port":9925},{"name":"Node2","url":"http://localhost:9927","host":"node-2-hdb","port":9925},{"name":"Node3","url":"http://localhost:9929","host":"node-3-hdb","port":9925},{"name":"Node4","url":"http://localhost:9931","host":"node-4-hdb","port":9925}]'
```

4. **Start the new node**:

```bash
docker-compose up -d node-4-app node-4-hdb
```

5. **Re-run bootstrap** to add the new node to the cluster:

```bash
npm run cluster:bootstrap
```

## Configuration

### Environment Variables

Cluster configuration can be customized via environment variables or `.env.local`:

- `HARPERDB_USERNAME`: Admin username (default: `HDB_ADMIN`)
- `HARPERDB_PASSWORD`: Admin password (default: `changeme`)
- `CLUSTERING_USER`: Cluster user account (default: `cluster_user`)
- `CLUSTERING_PASSWORD`: Cluster password (default: `cluster_pass_123`)
- `HARPERDB_SCHEMA`: Database schema (default: `cheatercheck`)
- `HARPERDB_TABLE`: Table name (default: `signals`)
- `CLUSTER_NODES`: JSON array of node configurations (optional)

### Port Allocation

Each node uses unique ports to avoid conflicts:

| Node | App Port | HarperDB HTTP | HarperDB Cluster | HarperDB SSL |
|------|----------|---------------|------------------|--------------|
| Node 1 | 3001 | 9925 | 9926 | 9932 |
| Node 2 | 3002 | 9927 | 9928 | 9933 |
| Node 3 | 3003 | 9929 | 9930 | 9934 |

## Data Synchronization

HarperDB handles data replication automatically once the cluster is configured:

- **Bidirectional Replication**: Changes on any node are replicated to all other nodes
- **Schema Propagation**: Schema and table changes propagate automatically
- **Conflict Resolution**: HarperDB handles conflicts using its built-in mechanisms

### Replication Configuration

The bootstrap script configures replication for the `cheatercheck.signals` table with:
- `subscribe: true` - Node receives updates from other nodes
- `publish: true` - Node sends updates to other nodes

To modify replication settings, use the HarperDB Operations API:

```json
{
  "operation": "set_node_replication",
  "node_name": "Node2",
  "subscriptions": [
    {
      "schema": "cheatercheck",
      "table": "signals",
      "subscribe": true,
      "publish": true
    }
  ]
}
```

## Troubleshooting

### Nodes Not Connecting

1. **Check all nodes are running**:
   ```bash
   docker-compose ps
   ```

2. **Check network connectivity**:
   ```bash
   docker-compose exec node-1-hdb ping node-2-hdb
   ```

3. **Verify clustering is enabled**:
   Check logs for clustering messages:
   ```bash
   docker-compose logs node-1-hdb | grep -i cluster
   ```

### Bootstrap Script Fails

1. **Wait for nodes to be fully ready**:
   ```bash
   # Wait a few seconds after starting
   sleep 10
   npm run cluster:bootstrap
   ```

2. **Check node URLs are correct**:
   Verify the URLs in `scripts/cluster-bootstrap.js` match your docker-compose port mappings.

3. **Verify credentials**:
   Ensure `HARPERDB_USERNAME` and `HARPERDB_PASSWORD` match the docker-compose configuration.

### Data Not Replicating

1. **Verify cluster status**:
   Connect to any node and check cluster status:
   ```bash
   curl -X POST http://localhost:9925 \
     -H "Content-Type: application/json" \
     -u HDB_ADMIN:changeme \
     -d '{"operation":"describe_cluster"}'
   ```

2. **Re-run bootstrap**:
   The bootstrap script is idempotent and can be run multiple times:
   ```bash
   npm run cluster:bootstrap
   ```

3. **Check replication subscriptions**:
   Verify subscriptions are configured correctly using the Operations API.

## Production Considerations

### Security

- **Change default passwords**: Update `HDB_ADMIN_PASSWORD` and `CLUSTERING_PASSWORD` in production
- **Use secrets management**: Consider using Docker secrets or environment variable injection
- **Network isolation**: Use Docker networks to isolate cluster traffic

### Performance

- **Resource allocation**: Each node requires CPU and memory resources
- **Network bandwidth**: Replication traffic increases with more nodes
- **Load balancing**: Use a load balancer in front of the app services

### High Availability

- **Multiple nodes**: Run at least 3 nodes for redundancy
- **Health checks**: Monitor node health and restart failed nodes
- **Backup strategy**: Implement regular backups of HarperDB data volumes

## References

- [HarperDB Clustering Documentation](https://docs.harperdb.io/docs/developers/replication/clustering)
- [HarperDB Operations API](https://docs.harperdb.io/docs/4.3/developers/operations-api/clustering)

