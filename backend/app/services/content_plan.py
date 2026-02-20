import json
from datetime import datetime, timedelta
from typing import List
from openai import AsyncOpenAI
import httpx
from app.core.config import settings
from app.schemas.schemas import ChannelResult, ContentPlanItem, GoalEnum


CONTENT_PLAN_PROMPT = """Создай контент-план на {days} дней для продукта: {product}

Каналы: {channels}
Цель: {goal}

Верни JSON-массив:
[
  {{
    "day": 1,
    "topic": "Тема поста",
    "channel": "Telegram",
    "headline": "Заголовок",
    "body": "Текст поста...",
    "cta": "Призыв к действию",
    "hashtags": ["#хештег"],
    "score": 8.0
  }},
  ...
]

Требования:
- Каждый день один пост
- Чередуй каналы если их несколько
- Разнообразие тем: проблемы → решения → кейсы → новости → вовлечение
- Продающий тон, но не навязчивый
- Включай призывы к действию
- Оценка качества (score) от 1 до 10"""


async def generate_content_plan_openai(
    product: str,
    days: int,
    channels: List[str],
    goal: GoalEnum
) -> List[ContentPlanItem]:
    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=getattr(settings, 'LLM_BASE_URL', None)
    )
    
    prompt = CONTENT_PLAN_PROMPT.format(
        days=days,
        product=product,
        channels=", ".join(channels),
        goal=goal.value if isinstance(goal, GoalEnum) else goal
    )
    
    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Ты — профессиональный SMM-стратег. Создаёшь продающие контент-планы."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=6000
    )
    
    content = response.choices[0].message.content or "[]"
    return parse_content_plan_response(content, days, channels)


async def generate_content_plan_yandex(
    product: str,
    days: int,
    channels: List[str],
    goal: GoalEnum
) -> List[ContentPlanItem]:
    prompt = CONTENT_PLAN_PROMPT.format(
        days=days,
        product=product,
        channels=", ".join(channels),
        goal=goal.value if isinstance(goal, GoalEnum) else goal
    )
    
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
                    "maxTokens": 6000
                },
                "messages": [
                    {"role": "system", "text": "Ты — профессиональный SMM-стратег. Создаёшь продающие контент-планы."},
                    {"role": "user", "text": prompt}
                ]
            },
            timeout=90.0
        )
        content = response.json()["result"]["alternatives"][0]["message"]["text"]
        return parse_content_plan_response(content, days, channels)


def generate_mock_content_plan(
    product: str,
    days: int,
    channels: List[str]
) -> List[ContentPlanItem]:
    items = []
    today = datetime.now()
    
    topics = [
        "Знакомство с продуктом",
        "Проблемы клиентов",
        "Решение",
        "Кейс успеха",
        "Ответы на вопросы",
        "Новости компании",
        "Специальное предложение"
    ]
    
    for i in range(days):
        date = today + timedelta(days=i)
        channel = channels[i % len(channels)]
        
        items.append(ContentPlanItem(
            day=i + 1,
            date=date.strftime("%Y-%m-%d"),
            topic=topics[i % len(topics)],
            channel=channel,
            draft=ChannelResult(
                headline=f"{topics[i % len(topics)]} — {product[:20]}",
                body=f"Текст поста на тему: {topics[i % len(topics)]}. Продукт: {product}",
                cta="Узнать подробнее",
                hashtags=["#контент", "#маркетинг"],
                score=7.5
            )
        ))
    
    return items


def parse_content_plan_response(content: str, days: int, channels: List[str]) -> List[ContentPlanItem]:
    try:
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        raw_items = json.loads(content.strip())
        
        if not isinstance(raw_items, list):
            raw_items = [raw_items]
        
        items = []
        today = datetime.now()
        
        for i, item in enumerate(raw_items[:days]):
            if isinstance(item, dict):
                date = today + timedelta(days=item.get("day", i + 1) - 1)
                items.append(ContentPlanItem(
                    day=item.get("day", i + 1),
                    date=date.strftime("%Y-%m-%d"),
                    topic=item.get("topic", f"Тема {i + 1}"),
                    channel=item.get("channel", channels[i % len(channels)]),
                    draft=ChannelResult(
                        headline=item.get("headline"),
                        body=item.get("body", ""),
                        cta=item.get("cta"),
                        hashtags=item.get("hashtags"),
                        score=float(item.get("score", 7.0))
                    )
                ))
        
        while len(items) < days:
            i = len(items)
            date = today + timedelta(days=i)
            items.append(ContentPlanItem(
                day=i + 1,
                date=date.strftime("%Y-%m-%d"),
                topic=f"Тема {i + 1}",
                channel=channels[i % len(channels)],
                draft=ChannelResult(body="Контент", score=5.0)
            ))
        
        return items
    except Exception as e:
        print(f"Error parsing content plan: {e}")
        return generate_mock_content_plan("Продукт", days, channels)


async def generate_content_plan(
    product: str,
    days: int,
    channels: List[str],
    goal: GoalEnum = GoalEnum.SALES
) -> List[ContentPlanItem]:
    if settings.MOCK_MODE:
        return generate_mock_content_plan(product, days, channels)
    
    try:
        if settings.LLM_PROVIDER == "yandex" and settings.YANDEX_API_KEY:
            return await generate_content_plan_yandex(product, days, channels, goal)
        elif settings.OPENAI_API_KEY:
            return await generate_content_plan_openai(product, days, channels, goal)
        else:
            return generate_mock_content_plan(product, days, channels)
    except Exception as e:
        print(f"Error generating content plan: {e}")
        return generate_mock_content_plan(product, days, channels)
