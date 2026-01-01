"""Generate signals from crawled profiles."""
import hashlib
import json
from typing import Dict, Any, List
from config import Config

def generate_image_hash(image_url: str) -> str:
    """
    Generate a hash from image URL.
    In production, you'd download and hash the actual image data.
    For now, hash the URL.
    """
    return hashlib.md5(image_url.encode()).hexdigest()

def generate_signals_from_profile(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Process a profile and generate signals matching the signals table schema.
    
    Args:
        profile: Raw profile data from Tinder
        
    Returns:
        List of signal records
    """
    signals = []
    
    full_name = profile.get("full_name", "")
    location = profile.get("location", "")
    app = "tinder"
    photos = profile.get("photos", [])
    
    if not full_name:
        return signals
    
    # Generate image hash from first photo if available
    image_hash = None
    if photos and len(photos) > 0:
        first_photo = photos[0] if isinstance(photos[0], str) else photos[0].get("url", "")
        if first_photo:
            image_hash = generate_image_hash(first_photo)
    
    # Signal 1: Profile detected
    signal_1 = {
        "full_name": full_name,
        "location": location,
        "app": app,
        "signal_type": "Profile detected",
        "status": "Active",
        "detail": f"Profile found on Tinder in {location}",
        "confidence": "High",
        "score": 50,
        "image_hash": image_hash or ""
    }
    signals.append(signal_1)
    
    # Signal 2: Multiple photos (if available)
    if photos and len(photos) > 1:
        signal_2 = {
            "full_name": full_name,
            "location": location,
            "app": app,
            "signal_type": "Multiple photos",
            "status": "Review",
            "detail": f"Profile has {len(photos)} photos",
            "confidence": "Medium",
            "score": 30,
            "image_hash": image_hash or ""
        }
        signals.append(signal_2)
    
    # Signal 3: Verified account (if applicable)
    if profile.get("verified", False):
        signal_3 = {
            "full_name": full_name,
            "location": location,
            "app": app,
            "signal_type": "Verified account",
            "status": "Active",
            "detail": "Profile is verified",
            "confidence": "High",
            "score": 40,
            "image_hash": image_hash or ""
        }
        signals.append(signal_3)
    
    # Signal 4: Has bio (if applicable)
    if profile.get("bio"):
        bio_length = len(profile.get("bio", ""))
        signal_4 = {
            "full_name": full_name,
            "location": location,
            "app": app,
            "signal_type": "Profile with bio",
            "status": "Review",
            "detail": f"Profile has bio ({bio_length} characters)",
            "confidence": "Medium",
            "score": 25,
            "image_hash": image_hash or ""
        }
        signals.append(signal_4)
    
    return signals

