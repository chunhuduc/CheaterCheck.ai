"""Main crawler entry point - Job-based polling."""
import sys
import os
import time
import logging

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import Config
from harperdb_client import HarperDBClient
from job_queue import JobQueue
from job_processor import JobProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Polling configuration
POLL_INTERVAL = 5  # seconds between polls
JOB_TIMEOUT = 1800  # 30 minutes - reset stuck jobs

def reset_stuck_jobs(job_queue: JobQueue):
    """Reset jobs that have been processing for too long."""
    try:
        now = int(time.time())
        timeout_threshold = now - JOB_TIMEOUT
        
        sql = f"""
            UPDATE {Config.HARPERDB_SCHEMA}.crawl_jobs 
            SET status = 'pending',
                assigned_to = NULL,
                current_step = 'Reset - timeout',
                last_updated = {now}
            WHERE status = 'processing' 
            AND last_updated < {timeout_threshold}
        """
        
        operation = {
            "operation": "sql",
            "sql": sql
        }
        
        result = job_queue.hdb._request(operation)
        if result:
            logger.info("Reset stuck jobs")
    except Exception as e:
        logger.warning(f"Failed to reset stuck jobs: {e}")

def run_job_poller():
    """Main job polling loop."""
    try:
        Config.validate()
        logger.info(f"Starting job-based crawler: {Config.CRAWLER_NODE_NAME}")
        logger.info(f"Region: {Config.REGION or 'Not specified'}")
        logger.info(f"Polling interval: {POLL_INTERVAL}s")
        
        # Initialize clients
        harperdb = HarperDBClient()
        job_queue = JobQueue(harperdb)
        job_processor = JobProcessor(job_queue, harperdb)
        
        logger.info("Crawler ready, polling for jobs...")
        
        while True:
            try:
                # Reset stuck jobs periodically
                reset_stuck_jobs(job_queue)
                
                # Poll for pending jobs
                pending_jobs = job_queue.poll_pending_jobs(limit=1)
                
                if pending_jobs:
                    job = pending_jobs[0]
                    job_id = job.get("id")
                    
                    # Try to claim the job
                    if job_queue.claim_job(job_id):
                        logger.info(f"Claimed job {job_id}: {job.get('search_query', {}).get('fullName', 'Unknown')}")
                        
                        # Process the job
                        success = job_processor.process_job(job)
                        
                        if success:
                            logger.info(f"Job {job_id} completed successfully")
                        else:
                            logger.error(f"Job {job_id} failed")
                    else:
                        logger.debug(f"Could not claim job {job_id} (may have been claimed by another crawler)")
                else:
                    logger.debug("No pending jobs, waiting...")
                
                # Wait before next poll
                time.sleep(POLL_INTERVAL)
                
            except KeyboardInterrupt:
                logger.info("Crawler stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in polling loop: {e}", exc_info=True)
                time.sleep(POLL_INTERVAL)
                
    except Exception as e:
        logger.error(f"Crawler initialization error: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    run_job_poller()

