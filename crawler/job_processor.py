"""Process individual crawl jobs."""
import sys
import os
import time
import logging
from typing import Dict, Any, List

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from job_queue import JobQueue
from harperdb_client import HarperDBClient
from tinder_client import TinderClient
from signal_generator import generate_signals_from_profile
from config import Config

logger = logging.getLogger(__name__)

class JobProcessor:
    """Process crawl jobs with progress updates."""
    
    def __init__(self, job_queue: JobQueue, harperdb: HarperDBClient):
        self.job_queue = job_queue
        self.harperdb = harperdb
        self.tinder = TinderClient()
    
    def process_job(self, job: Dict[str, Any]) -> bool:
        """
        Process a single crawl job.
        Returns True if successful, False otherwise.
        """
        job_id = job.get("id")
        search_query = job.get("search_query", {})
        
        if not job_id:
            logger.error("Job missing ID")
            return False
        
        logger.info(f"Processing job {job_id}: {search_query.get('fullName')}")
        
        try:
            # Update: Starting
            self.job_queue.update_job_progress(
                job_id, 
                progress=5,
                current_step="Authenticating with Tinder"
            )
            
            # Authenticate (if implemented)
            # self.tinder.authenticate()
            
            # Update: Searching
            self.job_queue.update_job_progress(
                job_id,
                progress=10,
                current_step="Searching for profiles"
            )
            
            # Extract search parameters
            full_name = search_query.get("fullName", "")
            location = search_query.get("location", "")
            app = search_query.get("app", "tinder")
            
            # Crawl profiles
            max_profiles = Config.MAX_PROFILES_PER_RUN
            profiles = self.tinder.crawl_profiles(max_profiles=max_profiles)
            
            logger.info(f"Found {len(profiles)} profiles for job {job_id}")
            
            # Process each profile
            profiles_inserted = 0
            signals_generated = 0
            total_profiles = len(profiles)
            
            for idx, profile in enumerate(profiles):
                try:
                    # Update progress
                    progress = 10 + int((idx / total_profiles) * 70) if total_profiles > 0 else 50
                    self.job_queue.update_job_progress(
                        job_id,
                        progress=progress,
                        current_step=f"Crawling profile {idx + 1}/{total_profiles}",
                        profiles_found=profiles_inserted
                    )
                    
                    tinder_id = profile.get("tinder_id")
                    
                    # Check for duplicates
                    if tinder_id and self.harperdb.check_duplicate(tinder_id):
                        logger.debug(f"Skipping duplicate profile: {tinder_id}")
                        continue
                    
                    # Insert profile (local only)
                    if self.harperdb.insert_profile(profile):
                        profiles_inserted += 1
                        logger.debug(f"Inserted profile: {profile.get('full_name')}")
                    else:
                        logger.warning(f"Failed to insert profile: {tinder_id}")
                        continue
                    
                    # Generate and insert signals (replicates across cluster)
                    signals = generate_signals_from_profile(profile)
                    if signals:
                        if self.harperdb.insert_signals(signals):
                            signals_generated += len(signals)
                            logger.debug(f"Generated {len(signals)} signals for {profile.get('full_name')}")
                        else:
                            logger.warning(f"Failed to insert signals for: {tinder_id}")
                    
                    # Rate limiting
                    time.sleep(Config.REQUEST_DELAY)
                
                except Exception as e:
                    logger.error(f"Error processing profile {idx}: {e}")
                    continue
            
            # Update: Processing signals
            self.job_queue.update_job_progress(
                job_id,
                progress=85,
                current_step="Generating signals",
                profiles_found=profiles_inserted,
                signals_generated=signals_generated
            )
            
            # Complete job
            self.job_queue.complete_job(
                job_id,
                profiles_found=profiles_inserted,
                signals_generated=signals_generated
            )
            
            logger.info(f"Job {job_id} completed: {profiles_inserted} profiles, {signals_generated} signals")
            return True
            
        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}", exc_info=True)
            error_msg = str(e)[:500]  # Limit error message length
            self.job_queue.fail_job(job_id, error_msg)
            return False

