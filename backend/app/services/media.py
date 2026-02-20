import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.models import ImageSettings
from app.schemas.schemas import ImageGenerateResponse


async def get_image_settings(db: AsyncSession) -> ImageSettings:
    result = await db.execute(select(ImageSettings))
    img_settings = result.scalar_one_or_none()
    
    if not img_settings:
        img_settings = ImageSettings(
            api_key=None,
            model="google/gemini-3-pro-image-preview",
            enabled=False
        )
        db.add(img_settings)
        await db.commit()
        await db.refresh(img_settings)
    
    return img_settings


async def generate_image_gemini(prompt: str, channel: str, api_key: str, model: str) -> ImageGenerateResponse:
    enhanced_prompt = f"Generate a professional marketing image: {prompt}. Style: modern, high quality, for {channel} social media."
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "modalities": ["image", "text"],
                "messages": [
                    {"role": "user", "content": enhanced_prompt}
                ]
            },
            timeout=120.0
        )
        
        if response.status_code == 402:
            raise Exception("Insufficient credits. Add credits to your OpenRouter account.")
        
        if response.status_code != 200:
            print(f"Image generation error: {response.status_code} - {response.text[:500]}")
            raise Exception(f"Image generation failed: {response.status_code}")
        
        data = response.json()
        image_url = None
        
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        if isinstance(content, str):
            import re
            base64_match = re.search(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+', content)
            if base64_match:
                image_url = base64_match.group(0)
            
            if not image_url:
                url_match = re.search(r'https?://[^\s"\']+\.(png|jpg|jpeg|gif|webp)', content)
                if url_match:
                    image_url = url_match.group(0)
        
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict):
                    if item.get("type") == "image_url":
                        image_url = item.get("image_url", {}).get("url")
                        break
                    elif item.get("type") == "image":
                        image_data = item.get("image", {})
                        if isinstance(image_data, str):
                            image_url = image_data
                        elif isinstance(image_data, dict):
                            image_url = image_data.get("url")
                        break
        
        if not image_url:
            print(f"No image in response: {str(data)[:500]}")
            raise Exception("No image in response")
        
        return ImageGenerateResponse(image_url=image_url, prompt=prompt)


def generate_mock_image(prompt: str, channel: str) -> ImageGenerateResponse:
    return ImageGenerateResponse(
        image_url=f"https://placehold.co/800x600/667eea/white?text={prompt[:20]}",
        prompt=prompt
    )


async def generate_image(prompt: str, channel: str, db: AsyncSession = None) -> ImageGenerateResponse:
    if settings.MOCK_MODE:
        return generate_mock_image(prompt, channel)
    
    api_key = None
    model = settings.IMAGE_MODEL
    enabled = True
    
    if db:
        try:
            img_settings = await get_image_settings(db)
            if img_settings.api_key:
                api_key = img_settings.api_key
                model = img_settings.model or model
                enabled = img_settings.enabled
        except Exception as e:
            print(f"Error getting image settings: {e}")
    
    if not api_key:
        api_key = settings.OPENROUTER_API_KEY or settings.OPENAI_API_KEY
    
    if not api_key or not enabled:
        return generate_mock_image(prompt, channel)
    
    try:
        return await generate_image_gemini(prompt, channel, api_key, model)
    except Exception as e:
        print(f"Image generation error: {e}")
        return generate_mock_image(prompt, channel)
