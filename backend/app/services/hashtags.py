import json
from typing import List
from openai import AsyncOpenAI
import httpx
from app.core.config import settings


HASHTAG_PROMPT = """Сгенерируй продающие хештеги для следующего текста.

Текст:
{text}

Канал: {channel}

Верни JSON:
{{
  "hashtags": ["#хештег1", "#хештег2", ...],
  "selling_hashtags": ["#продающий1", "#продающий2", ...]
}}

Требования:
- Обычные хештеги: тематические, популярные, релевантные контенту
- Продающие хештеги: с призывом к действию, создающие срочность
- Всего {count} хештегов (примерно поровну обоих типов)
- На русском языке
- Без пробелов внутри хештега"""


async def generate_hashtags_openai(text: str, channel: str, count: int) -> dict:
    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=getattr(settings, 'LLM_BASE_URL', None)
    )
    
    prompt = HASHTAG_PROMPT.format(text=text, channel=channel, count=count)
    
    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Ты — SMM-специалист, эксперт по хештегам для российских соцсетей."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=500
    )
    
    content = response.choices[0].message.content or "{}"
    return parse_hashtags_response(content)


async def generate_hashtags_yandex(text: str, channel: str, count: int) -> dict:
    prompt = HASHTAG_PROMPT.format(text=text, channel=channel, count=count)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
            headers={
                "Authorization": f"Api-Key {settings.YANDEX_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "modelUri": f"gpt://{settings.YANDEX_API_KEY}/yandexgpt/latest",
                "completionOptions": {
                    "stream": False,
                    "temperature": 0.7,
                    "maxTokens": 500
                },
                "messages": [
                    {"role": "system", "text": "Ты — SMM-специалист, эксперт по хештегам для российских соцсетей."},
                    {"role": "user", "text": prompt}
                ]
            },
            timeout=30.0
        )
        content = response.json()["result"]["alternatives"][0]["message"]["text"]
        return parse_hashtags_response(content)


def generate_mock_hashtags(text: str, channel: str, count: int) -> dict:
    words = text.lower().split()
    keywords = [w for w in words if len(w) > 4][:count//2]
    
    hashtags = [f"#{w}" for w in keywords]
    selling = ["#купитьсейчас", "#акция", "#скидки", "#хитпродаж", "#успей"]
    
    return {
        "hashtags": hashtags[:count//2] or ["#контент", "#маркетинг"],
        "selling_hashtags": selling[:count//2]
    }


def parse_hashtags_response(content: str) -> dict:
    try:
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        result = json.loads(content.strip())
        return {
            "hashtags": result.get("hashtags", []),
            "selling_hashtags": result.get("selling_hashtags", [])
        }
    except:
        return {"hashtags": [], "selling_hashtags": []}


async def generate_hashtags(text: str, channel: str, count: int = 5) -> dict:
    if settings.MOCK_MODE:
        return generate_mock_hashtags(text, channel, count)
    
    try:
        if settings.LLM_PROVIDER == "yandex" and settings.YANDEX_API_KEY:
            return await generate_hashtags_yandex(text, channel, count)
        elif settings.OPENAI_API_KEY:
            return await generate_hashtags_openai(text, channel, count)
        else:
            return generate_mock_hashtags(text, channel, count)
    except Exception as e:
        print(f"Error generating hashtags: {e}")
        return generate_mock_hashtags(text, channel, count)
