"""Configuration management for Tinder crawler."""
import os
from typing import Optional

class Config:
    """Crawler configuration from environment variables."""
    
    # HarperDB configuration
    HARPERDB_URL: str = os.getenv("HARPERDB_URL", "http://localhost:9925")
    HARPERDB_USERNAME: str = os.getenv("HARPERDB_USERNAME", "HDB_ADMIN")
    HARPERDB_PASSWORD: str = os.getenv("HARPERDB_PASSWORD", "changeme")
    HARPERDB_SCHEMA: str = os.getenv("HARPERDB_SCHEMA", "cheatercheck")
    HARPERDB_TABLE_PROFILES: str = "profiles"
    HARPERDB_TABLE_SIGNALS: str = "signals"
    
    # Crawler configuration
    CRAWLER_NODE_NAME: str = os.getenv("CRAWLER_NODE_NAME", "tinder-crawler-1")
    REGION: Optional[str] = os.getenv("REGION")
    CRAWL_INTERVAL: int = int(os.getenv("CRAWL_INTERVAL", "3600"))  # seconds
    MAX_PROFILES_PER_RUN: int = int(os.getenv("MAX_PROFILES_PER_RUN", "100"))
    
    # Tinder API configuration (placeholder - implement based on your API method)
    TINDER_API_KEY: Optional[str] = os.getenv("TINDER_API_KEY")
    TINDER_API_SECRET: Optional[str] = os.getenv("TINDER_API_SECRET")
    TINDER_AUTH_TOKEN: Optional[str] = os.getenv("TINDER_AUTH_TOKEN")
    
    # Rate limiting
    REQUEST_DELAY: float = float(os.getenv("REQUEST_DELAY", "2.0"))  # seconds between requests
    
    @classmethod
    def validate(cls) -> bool:
        """Validate required configuration."""
        if not cls.HARPERDB_URL:
            raise ValueError("HARPERDB_URL is required")
        if not cls.HARPERDB_USERNAME:
            raise ValueError("HARPERDB_USERNAME is required")
        if not cls.HARPERDB_PASSWORD:
            raise ValueError("HARPERDB_PASSWORD is required")
        return True

