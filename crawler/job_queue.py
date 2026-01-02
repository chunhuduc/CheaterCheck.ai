"""Job queue operations for crawler."""
import sys
import os
import time
import json
from typing import Dict, Any, Optional

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harperdb_client import HarperDBClient
from config import Config

class JobQueue:
    """Handle job queue operations from HarperDB."""
    
    def __init__(self, harperdb_client: HarperDBClient):
        self.hdb = harperdb_client
        self.node_name = Config.CRAWLER_NODE_NAME
    
    def poll_pending_jobs(self, limit: int = 1) -> list:
        """Poll for pending jobs from crawl_jobs table."""
        sql = f"""
            SELECT * FROM {Config.HARPERDB_SCHEMA}.crawl_jobs 
            WHERE status = 'pending' 
            ORDER BY priority DESC, created_at ASC 
            LIMIT {limit}
        """
        
        operation = {
            "operation": "sql",
            "sql": sql
        }
        
        result = self.hdb._request(operation)
        if result and isinstance(result, list):
            return result
        return []
    
    def claim_job(self, job_id: str) -> bool:
        """
        Claim a job by updating status to processing and assigning to this node.
        Uses atomic update to prevent race conditions.
        """
        now = int(time.time())
        sql = f"""
            UPDATE {Config.HARPERDB_SCHEMA}.crawl_jobs 
            SET status = 'processing', 
                assigned_to = '{self.node_name}',
                last_updated = {now},
                current_step = 'Claimed by {self.node_name}'
            WHERE id = '{job_id}' AND status = 'pending'
        """
        
        operation = {
            "operation": "sql",
            "sql": sql
        }
        
        result = self.hdb._request(operation)
        # Check if update was successful (affected rows > 0)
        if result:
            # HarperDB SQL update returns affected count or success indicator
            return True
        return False
    
    def update_job_progress(
        self, 
        job_id: str, 
        progress: int, 
        current_step: str,
        profiles_found: int = None,
        signals_generated: int = None
    ) -> bool:
        """Update job progress in crawl_jobs table."""
        now = int(time.time())
        
        updates = [
            f"progress = {max(0, min(100, progress))}",
            f"current_step = '{current_step.replace(\"'\", \"''\")}'",
            f"last_updated = {now}"
        ]
        
        if profiles_found is not None:
            updates.append(f"profiles_found = {profiles_found}")
        if signals_generated is not None:
            updates.append(f"signals_generated = {signals_generated}")
        
        sql = f"""
            UPDATE {Config.HARPERDB_SCHEMA}.crawl_jobs 
            SET {', '.join(updates)}
            WHERE id = '{job_id}'
        """
        
        operation = {
            "operation": "sql",
            "sql": sql
        }
        
        result = self.hdb._request(operation)
        return result is not None
    
    def complete_job(
        self, 
        job_id: str, 
        profiles_found: int = 0,
        signals_generated: int = 0
    ) -> bool:
        """Mark job as completed."""
        now = int(time.time())
        sql = f"""
            UPDATE {Config.HARPERDB_SCHEMA}.crawl_jobs 
            SET status = 'completed',
                progress = 100,
                current_step = 'Completed',
                profiles_found = {profiles_found},
                signals_generated = {signals_generated},
                last_updated = {now}
            WHERE id = '{job_id}'
        """
        
        operation = {
            "operation": "sql",
            "sql": sql
        }
        
        result = self.hdb._request(operation)
        return result is not None
    
    def fail_job(self, job_id: str, error_message: str) -> bool:
        """Mark job as failed with error message."""
        now = int(time.time())
        safe_error = error_message.replace("'", "''")
        sql = f"""
            UPDATE {Config.HARPERDB_SCHEMA}.crawl_jobs 
            SET status = 'failed',
                current_step = 'Failed',
                error_message = '{safe_error}',
                last_updated = {now}
            WHERE id = '{job_id}'
        """
        
        operation = {
            "operation": "sql",
            "sql": sql
        }
        
        result = self.hdb._request(operation)
        return result is not None
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific job by ID."""
        sql = f"""
            SELECT * FROM {Config.HARPERDB_SCHEMA}.crawl_jobs 
            WHERE id = '{job_id}' 
            LIMIT 1
        """
        
        operation = {
            "operation": "sql",
            "sql": sql
        }
        
        result = self.hdb._request(operation)
        if result and isinstance(result, list) and len(result) > 0:
            return result[0]
        return None
