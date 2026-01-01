"""HarperDB client for crawler operations."""
import json
import hashlib
import time
from typing import Dict, Any, Optional, List
import requests
from config import Config
from schema_init import ensure_profiles_table

class HarperDBClient:
    """Client for interacting with HarperDB."""
    
    def __init__(self):
        self.base_url = Config.HARPERDB_URL
        self.auth = (Config.HARPERDB_USERNAME, Config.HARPERDB_PASSWORD)
        self.headers = {"Content-Type": "application/json"}
        self._ensure_tables()
    
    def _ensure_tables(self):
        """Ensure profiles table exists on initialization."""
        ensure_profiles_table()
    
    def _request(self, operation: Dict[str, Any], retries: int = 3) -> Optional[Dict[str, Any]]:
        """Make HTTP request to HarperDB with retry logic."""
        for attempt in range(retries):
            try:
                response = requests.post(
                    self.base_url,
                    json=operation,
                    headers=self.headers,
                    auth=self.auth,
                    timeout=30
                )
                if response.status_code == 200:
                    return response.json() if response.text else {}
                elif response.status_code == 400:
                    # Some operations return 400 for "already exists" which is OK
                    result = response.json() if response.text else {}
                    if "already exists" in str(result).lower() or "exists" in str(result).lower():
                        return result
                else:
                    if attempt < retries - 1:
                        time.sleep(1 * (attempt + 1))
                        continue
                    print(f"HarperDB request failed: {response.status_code} - {response.text}")
                    return None
            except Exception as e:
                if attempt < retries - 1:
                    time.sleep(1 * (attempt + 1))
                    continue
                print(f"HarperDB request error: {e}")
                return None
        return None
    
    def insert_profile(self, profile_data: Dict[str, Any]) -> bool:
        """
        Insert raw profile into local profiles table.
        This table is NOT replicated across cluster.
        """
        # Generate ID from tinder_id if not provided
        if "id" not in profile_data:
            tinder_id = profile_data.get("tinder_id", "")
            profile_data["id"] = f"prof_{hashlib.md5(tinder_id.encode()).hexdigest()[:16]}"
        
        # Add metadata
        profile_data["crawler_node"] = Config.CRAWLER_NODE_NAME
        if "crawled_at" not in profile_data:
            profile_data["crawled_at"] = int(time.time())
        
        operation = {
            "operation": "insert",
            "schema": Config.HARPERDB_SCHEMA,
            "table": Config.HARPERDB_TABLE_PROFILES,
            "records": [profile_data]
        }
        
        result = self._request(operation)
        return result is not None
    
    def check_duplicate(self, tinder_id: str) -> bool:
        """Check if profile with tinder_id already exists in local profiles table."""
        operation = {
            "operation": "sql",
            "sql": f"SELECT * FROM {Config.HARPERDB_SCHEMA}.{Config.HARPERDB_TABLE_PROFILES} WHERE tinder_id = '{tinder_id}' LIMIT 1"
        }
        
        result = self._request(operation)
        if result and isinstance(result, list) and len(result) > 0:
            return True
        return False
    
    def insert_signal(self, signal_data: Dict[str, Any]) -> bool:
        """
        Insert signal into signals table.
        This table IS replicated across cluster.
        """
        # Generate ID if not provided
        if "id" not in signal_data:
            name = signal_data.get("full_name", "")
            location = signal_data.get("location", "")
            signal_type = signal_data.get("signal_type", "")
            signal_data["id"] = f"sig_{hashlib.md5(f'{name}{location}{signal_type}'.encode()).hexdigest()[:16]}"
        
        operation = {
            "operation": "insert",
            "schema": Config.HARPERDB_SCHEMA,
            "table": Config.HARPERDB_TABLE_SIGNALS,
            "records": [signal_data]
        }
        
        result = self._request(operation)
        return result is not None
    
    def insert_signals(self, signals: List[Dict[str, Any]]) -> bool:
        """Insert multiple signals into signals table."""
        if not signals:
            return True
        
        # Generate IDs for signals that don't have them
        for signal in signals:
            if "id" not in signal:
                name = signal.get("full_name", "")
                location = signal.get("location", "")
                signal_type = signal.get("signal_type", "")
                signal["id"] = f"sig_{hashlib.md5(f'{name}{location}{signal_type}'.encode()).hexdigest()[:16]}"
        
        operation = {
            "operation": "insert",
            "schema": Config.HARPERDB_SCHEMA,
            "table": Config.HARPERDB_TABLE_SIGNALS,
            "records": signals
        }
        
        result = self._request(operation)
        return result is not None

