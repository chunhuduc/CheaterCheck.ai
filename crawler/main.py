"""Main crawler entry point."""
import sys
import time
import logging
from typing import List
from config import Config
from harperdb_client import HarperDBClient
from tinder_client import TinderClient
from signal_generator import generate_signals_from_profile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_crawler():
    """Main crawler execution loop."""
    try:
        Config.validate()
        logger.info(f"Starting Tinder crawler: {Config.CRAWLER_NODE_NAME}")
        logger.info(f"Region: {Config.REGION or 'Not specified'}")
        
        # Initialize clients
        harperdb = HarperDBClient()
        tinder = TinderClient()
        
        # Authenticate (if implemented)
        # tinder.authenticate()
        
        # Crawl profiles
        profiles = tinder.crawl_profiles(max_profiles=Config.MAX_PROFILES_PER_RUN)
        logger.info(f"Crawled {len(profiles)} profiles")
        
        # Process each profile
        profiles_inserted = 0
        signals_generated = 0
        
        for profile in profiles:
            try:
                tinder_id = profile.get("tinder_id")
                
                # Check for duplicates
                if tinder_id and harperdb.check_duplicate(tinder_id):
                    logger.debug(f"Skipping duplicate profile: {tinder_id}")
                    continue
                
                # Insert profile (local only)
                if harperdb.insert_profile(profile):
                    profiles_inserted += 1
                    logger.debug(f"Inserted profile: {profile.get('full_name')}")
                else:
                    logger.warning(f"Failed to insert profile: {tinder_id}")
                    continue
                
                # Generate and insert signals (replicates across cluster)
                signals = generate_signals_from_profile(profile)
                if signals:
                    if harperdb.insert_signals(signals):
                        signals_generated += len(signals)
                        logger.debug(f"Generated {len(signals)} signals for {profile.get('full_name')}")
                    else:
                        logger.warning(f"Failed to insert signals for: {tinder_id}")
            
            except Exception as e:
                logger.error(f"Error processing profile {profile.get('tinder_id', 'unknown')}: {e}")
                continue
        
        logger.info(f"Crawl complete: {profiles_inserted} profiles inserted, {signals_generated} signals generated")
        
    except Exception as e:
        logger.error(f"Crawler error: {e}", exc_info=True)
        sys.exit(1)

def run_continuous():
    """Run crawler in continuous mode with interval."""
    logger.info(f"Starting continuous crawler (interval: {Config.CRAWL_INTERVAL}s)")
    
    while True:
        try:
            run_crawler()
            logger.info(f"Waiting {Config.CRAWL_INTERVAL} seconds until next crawl...")
            time.sleep(Config.CRAWL_INTERVAL)
        except KeyboardInterrupt:
            logger.info("Crawler stopped by user")
            break
        except Exception as e:
            logger.error(f"Crawler error in continuous mode: {e}", exc_info=True)
            logger.info(f"Retrying in {Config.CRAWL_INTERVAL} seconds...")
            time.sleep(Config.CRAWL_INTERVAL)

if __name__ == "__main__":
    # Run once or continuously based on environment
    if Config.CRAWL_INTERVAL > 0:
        run_continuous()
    else:
        run_crawler()

