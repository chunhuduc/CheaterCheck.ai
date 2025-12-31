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
