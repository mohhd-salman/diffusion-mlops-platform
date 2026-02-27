from pydantic import BaseModel

# REQUEST
class ImageGenerateRequest(BaseModel):
    prompt: str