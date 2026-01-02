CREATE SCHEMA cheatercheck;
CREATE TABLE cheatercheck.signals (
  id STRING PRIMARY KEY,
  full_name STRING,
  location STRING,
  app STRING,
  signal_type STRING,
  status STRING,
  detail STRING,
  confidence STRING,
  score INT,
  image_hash STRING
);

CREATE TABLE cheatercheck.crawl_jobs (
  id STRING PRIMARY KEY,
  search_query JSON,
  status STRING,
  progress INT,
  current_step STRING,
  profiles_found INT,
  signals_generated INT,
  created_at INT,
  created_by STRING,
  assigned_to STRING,
  priority INT,
  retry_count INT,
  last_updated INT,
  error_message STRING
);
