from pydantic import BaseModel
from typing import Optional

class SeparateRequest(BaseModel):
    video_id: str
    title: str = "Unknown Title"
    mode: str = "basic"  # "basic" or "pro"
    rapidapi_key: Optional[str] = None
    use_manual_upload: Optional[bool] = False
