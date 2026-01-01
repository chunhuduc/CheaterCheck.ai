"""Initialize profiles table schema locally in crawler node's HarperDB."""
import json
import requests
from typing import Dict, Any
import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import Config

def ensure_profiles_table() -> bool:
    """
    Create profiles table locally if it doesn't exist.
    This table is NOT replicated across the cluster.
    """
    auth = (Config.HARPERDB_USERNAME, Config.HARPERDB_PASSWORD)
    headers = {"Content-Type": "application/json"}
    
    # Ensure schema exists
    schema_op = {
        "operation": "create_schema",
        "schema": Config.HARPERDB_SCHEMA
    }
    
    try:
        response = requests.post(
            Config.HARPERDB_URL,
            json=schema_op,
            headers=headers,
            auth=auth,
            timeout=10
        )
        if response.status_code in [200, 400]:  # 400 might mean already exists
            print(f"Schema {Config.HARPERDB_SCHEMA} ensured")
    except Exception as e:
        # Ignore if schema already exists
        if "already exists" not in str(e).lower():
            print(f"Note: Schema operation result: {e}")
    
    # Create profiles table
    table_op = {
        "operation": "create_table",
        "schema": Config.HARPERDB_SCHEMA,
        "table": Config.HARPERDB_TABLE_PROFILES,
        "hash_attribute": "id"
    }
    
    try:
        response = requests.post(
            Config.HARPERDB_URL,
            json=table_op,
            headers=headers,
            auth=auth,
            timeout=10
        )
        if response.status_code == 200:
            print(f"✓ Profiles table created: {Config.HARPERDB_SCHEMA}.{Config.HARPERDB_TABLE_PROFILES}")
            return True
        elif response.status_code == 400:
            # Table might already exist
            result = response.json() if response.text else {}
            if "already exists" in str(result).lower() or "exists" in str(result).lower():
                print(f"✓ Profiles table already exists: {Config.HARPERDB_SCHEMA}.{Config.HARPERDB_TABLE_PROFILES}")
                return True
        else:
            print(f"✗ Failed to create profiles table: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error creating profiles table: {e}")
        return False

if __name__ == "__main__":
    Config.validate()
    ensure_profiles_table()

