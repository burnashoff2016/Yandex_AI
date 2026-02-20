import json
from openai import AsyncOpenAI
import httpx
from app.core.config import settings
from app.schemas.schemas import AudienceAnalysisResponse


AUDIENCE_ANALYSIS_PROMPT = """Проанализируй целевую аудиторию для продукта.

Продукт: {product}
{description_extra}

Верни JSON:
{{
  "age_range": "25-45 лет",
  "gender": "мужчины и женщины",
  "interests": ["интерес1", "интерес2", ...],
  "pains": ["боль1", "боль2", ...],
  "triggers": ["триггер1", "триггер2", ...],
  "channels": ["канал1", "канал2", ...],
  "content_preferences": ["предпочтение1", "предпочтение2", ...]
}}

Требования:
- age_range: примерный возрастной диапазон
- gender: пол аудитории (мужчины/женщины/все)
- interests: 5-7 основных интересов
- pains: 3-5 болевых точек, которые решает продукт
- triggers: 3-5 триггеров покупки
- channels: 3-5 каналов где обитает аудитория
- content_preferences: 3-5 предпочтений по контенту"""


async def analyze_audience_openai(product: str, description: str = None) -> AudienceAnalysisResponse:
    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=getattr(settings, 'LLM_BASE_URL', None)
    )
    
    extra = f"\nОписание: {description}" if description else ""
    prompt = AUDIENCE_ANALYSIS_PROMPT.format(product=product, description_extra=extra)
    
    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Ты — маркетолог-аналитик, специализируешься на анализе целевых аудиторий."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=1000
    )
    
    content = response.choices[0].message.content or "{}"
    return parse_audience_response(content)


async def analyze_audience_yandex(product: str, description: str = None) -> AudienceAnalysisResponse:
    extra = f"\nОписание: {description}" if description else ""
    prompt = AUDIENCE_ANALYSIS_PROMPT.format(product=product, description_extra=extra)
    
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
                    "temperature": 0.3,
                    "maxTokens": 1000
                },
                "messages": [
                    {"role": "system", "text": "Ты — маркетолог-аналитик, специализируешься на анализе целевых аудиторий."},
                    {"role": "user", "text": prompt}
                ]
            },
            timeout=30.0
        )
        content = response.json()["result"]["alternatives"][0]["message"]["text"]
        return parse_audience_response(content)


def generate_mock_audience_analysis(product: str) -> AudienceAnalysisResponse:
    return AudienceAnalysisResponse(
        age_range="25-45 лет",
        gender="мужчины и женщины",
        interests=["технологии", "бизнес", "саморазвитие", "финансы", "карьера"],
        pains=["нехватка времени", "сложный выбор", "высокие цены конкурентов"],
        triggers=["экономия", "качество", "скорость", "гарантии"],
        channels=["Telegram", "VK", "Яндекс.Дзен"],
        content_preferences=["кейсы", "инструкции", "сравнения", "новости"]
    )


def parse_audience_response(content: str) -> AudienceAnalysisResponse:
    try:
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        data = json.loads(content.strip())
        
        return AudienceAnalysisResponse(
            age_range=data.get("age_range", "25-45 лет"),
            gender=data.get("gender", "все"),
            interests=data.get("interests", []),
            pains=data.get("pains", []),
            triggers=data.get("triggers", []),
            channels=data.get("channels", []),
            content_preferences=data.get("content_preferences", [])
        )
    except Exception as e:
        print(f"Error parsing audience analysis: {e}")
        return generate_mock_audience_analysis("Продукт")


async def analyze_audience(product: str, description: str = None) -> AudienceAnalysisResponse:
    if settings.MOCK_MODE:
        return generate_mock_audience_analysis(product)
    
    try:
        if settings.LLM_PROVIDER == "yandex" and settings.YANDEX_API_KEY:
            return await analyze_audience_yandex(product, description)
        elif settings.OPENAI_API_KEY:
            return await analyze_audience_openai(product, description)
        else:
            return generate_mock_audience_analysis(product)
    except Exception as e:
        print(f"Error analyzing audience: {e}")
        return generate_mock_audience_analysis(product)
