# Tinder Crawler Node

This document describes the Tinder crawler node architecture and how to deploy and manage crawler nodes.

## Architecture Overview

Each crawler node is a self-contained unit consisting of:
- **Python Crawler Service**: Extracts Tinder profile data
- **HarperDB Instance**: Joins the cluster for signals replication, maintains local profiles table

### Data Flow

1. **Crawler extracts profiles** from Tinder (photos, name, bio, age, location, etc.)
2. **Raw profiles stored locally** in `cheatercheck.profiles` table (NOT replicated across cluster)
3. **Signals generated** from profiles and stored in `cheatercheck.signals` table
4. **Signals replicate** across all cluster nodes (app nodes and crawler nodes)
5. **Profiles remain local** to each crawler node for privacy and storage efficiency

## Quick Start

### 1. Start Crawler Node

```bash
npm run crawler:up
```

This starts both the crawler service and its HarperDB instance.

### 2. Bootstrap Cluster (if not already done)

If this is the first time adding the crawler node to the cluster:

```bash
npm run cluster:bootstrap
```

This will add the crawler node to the cluster and configure signals table replication.

### 3. Monitor Crawler

```bash
npm run crawler:logs
```

View crawler logs to see:
- Profiles being crawled
- Signals being generated
- Any errors or warnings

### 4. Check Status

```bash
npm run crawler:status
```

## Configuration

Crawler configuration is set via environment variables in `docker-compose.yml`:

### HarperDB Configuration
- `HARPERDB_URL`: Local HarperDB instance URL (e.g., `http://tinder-crawler-1-hdb:9925`)
- `HARPERDB_USERNAME`: Admin username (default: `HDB_ADMIN`)
- `HARPERDB_PASSWORD`: Admin password
- `HARPERDB_SCHEMA`: Schema name (default: `cheatercheck`)

### Crawler Configuration
- `CRAWLER_NODE_NAME`: Unique identifier for this crawler node
- `REGION`: Geographic region this crawler targets (optional)
- `CRAWL_INTERVAL`: How often to crawl in seconds (default: `3600` = 1 hour)
- `MAX_PROFILES_PER_RUN`: Maximum profiles to crawl per run (default: `100`)
- `REQUEST_DELAY`: Delay between requests in seconds (default: `2.0`)

### Tinder API Configuration
- `TINDER_API_KEY`: API key (if using official API)
- `TINDER_API_SECRET`: API secret (if using official API)
- `TINDER_AUTH_TOKEN`: Authentication token (if using token-based auth)

## Database Schema

### Profiles Table (Local Only)

The `cheatercheck.profiles` table stores raw crawled data and is created automatically by each crawler node. It is **NOT replicated** across the cluster.

Schema:
- `id` (STRING, PRIMARY KEY): Unique profile ID
- `tinder_id` (STRING): Tinder profile ID
- `full_name` (STRING): Profile name
- `age` (INT): Age
- `bio` (STRING): Profile bio
- `location` (STRING): City/region
- `coordinates` (JSON): Latitude/longitude
- `photos` (JSON): Array of photo URLs/hashes
- `verified` (BOOLEAN): Verified account status
- `crawled_at` (INT): Timestamp when crawled
- `crawler_node` (STRING): Which crawler node collected this
- `raw_data` (JSON): Additional raw data

### Signals Table (Replicated)

The `cheatercheck.signals` table is replicated across all cluster nodes. See the main schema documentation for details.

## Implementation Notes

### Tinder Client

The `tinder_client.py` file currently contains placeholder/mock implementation. In production, you'll need to:

1. **Choose your approach**:
   - Use Tinder's official API (if available)
   - Implement browser automation (Selenium/Playwright)
   - Use reverse-engineered API endpoints (consider legal implications)

2. **Handle authentication**:
   - Implement token-based auth
   - Handle session management
   - Manage rate limiting

3. **Respect rate limits**:
   - Use `REQUEST_DELAY` configuration
   - Implement exponential backoff
   - Handle API rate limit responses

### Signal Generation

The `signal_generator.py` generates signals from profiles. Currently generates:
- Profile detected signal
- Multiple photos signal
- Verified account signal
- Profile with bio signal

You can extend this to generate more sophisticated signals based on your requirements.

### Image Hashing

Currently, image hashes are generated from URLs. In production, you should:
1. Download images
2. Generate perceptual hashes (e.g., using `imagehash` library)
3. Store hashes for duplicate detection

## Adding More Crawler Nodes

To add additional crawler nodes:

1. **Edit `docker-compose.yml`** and duplicate the crawler services:

```yaml
  # Tinder Crawler Node 2
  tinder-crawler-2-app:
    build: ./crawler
    ports:
      - "4002:4000"
    environment:
      HARPERDB_URL: "http://tinder-crawler-2-hdb:9925"
      HARPERDB_USERNAME: "HDB_ADMIN"
      HARPERDB_PASSWORD: "changeme"
      HARPERDB_SCHEMA: "cheatercheck"
      CRAWLER_NODE_NAME: "tinder-crawler-2"
      REGION: "us-east"
      # ... other config
    depends_on:
      - tinder-crawler-2-hdb
    networks:
      - harperdb-cluster

  tinder-crawler-2-hdb:
    <<: *node-hdb
    ports:
      - "9951:9925"
      - "9952:9926"
      - "9953:9932"
    environment:
      # ... same as tinder-crawler-1-hdb
      CLUSTERING_NODENAME: "TinderCrawler2"
    volumes:
      - tinder-crawler-2-data:/opt/harperdb/hdb
```

2. **Add volume** in volumes section:
```yaml
volumes:
  # ... existing volumes
  tinder-crawler-2-data:
```

3. **Update `scripts/cluster-bootstrap.js`** to include the new node in the `NODES` array:
```javascript
const NODES = [
  // ... existing nodes
  { name: 'TinderCrawler2', url: 'http://localhost:9951', host: 'tinder-crawler-2-hdb', port: 9925 },
];
```

4. **Start the new node**:
```bash
docker-compose up -d tinder-crawler-2-app tinder-crawler-2-hdb
```

5. **Re-run bootstrap**:
```bash
npm run cluster:bootstrap
```

## Troubleshooting

### Crawler Not Starting

1. **Check logs**:
   ```bash
   docker-compose logs tinder-crawler-1-app
   ```

2. **Verify HarperDB is ready**:
   ```bash
   docker-compose logs tinder-crawler-1-hdb
   ```

3. **Check configuration**:
   Ensure all required environment variables are set correctly.

### Profiles Table Not Created

The profiles table is created automatically when the crawler starts. If it fails:

1. Check HarperDB connection in crawler logs
2. Verify credentials are correct
3. Check if schema exists (created during cluster bootstrap)

### Signals Not Replicating

1. **Verify cluster configuration**:
   ```bash
   npm run cluster:bootstrap
   ```

2. **Check cluster status**:
   Connect to any node and check cluster status using HarperDB Operations API

3. **Verify signals table replication**:
   Signals table should be configured for replication, not profiles table.

### High Memory/CPU Usage

1. **Reduce crawl rate**: Increase `CRAWL_INTERVAL`
2. **Limit profiles per run**: Reduce `MAX_PROFILES_PER_RUN`
3. **Increase request delay**: Increase `REQUEST_DELAY`

## Legal and Ethical Considerations

**Important**: Web scraping and data collection may have legal and ethical implications:

1. **Terms of Service**: Review Tinder's Terms of Service regarding data collection
2. **Privacy Laws**: Consider GDPR, CCPA, and other privacy regulations
3. **Rate Limiting**: Respect rate limits and implement appropriate delays
4. **Data Retention**: Implement data retention policies
5. **User Consent**: Consider whether user consent is required for data collection

**This is a technical implementation guide. Ensure you comply with all applicable laws and terms of service before deploying.**

## References

- [HarperDB Clustering Documentation](https://docs.harperdb.io/docs/developers/replication/clustering)
- [HarperDB Operations API](https://docs.harperdb.io/docs/4.3/developers/operations-api/clustering)
- [Main Cluster Documentation](./CLUSTER.md)

