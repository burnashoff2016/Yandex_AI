import json
from typing import List
from openai import AsyncOpenAI
import httpx
from app.core.config import settings
from app.schemas.schemas import ChannelResult, GoalEnum, ToneEnum


SERIES_PROMPT = """Создай серию из {count} постов на тему: {topic}

Канал: {channel}
Цель: {goal}
Тон: {tone}

Верни JSON-массив:
[
  {{
    "headline": "Заголовок поста",
    "body": "Текст поста...",
    "cta": "Призыв к действию",
    "hashtags": ["#хештег1", "#хештег2"],
    "score": 8.5,
    "improvements": ["рекомендация"]
  }},
  ...
]

Требования:
- Каждый пост должен быть уникальным, но связанным общей темой
- Создавай последовательную историю/нарратив
- Каждый пост должен иметь свой уникальный угол/аспект темы
- Включай продающие хештеги
- Оценка качества (score) от 1 до 10"""


FORMAT_INSTRUCTIONS = {
    "short": "Короткий пост до 200 слов. Лаконично, по делу.",
    "longread": "Развёрнутый материал 500-1000 слов. Детальный разбор с примерами.",
    "case_study": "Кейс: проблема → решение → результат. Цифры и факты.",
    "story": "Сторителлинг: завязка → развитие → кульминация → финал. Эмоции."
}


async def generate_series_openai(
    topic: str,
    channel: str,
    count: int,
    goal: GoalEnum,
    tone: ToneEnum,
    format_type: str = "short"
) -> List[ChannelResult]:
    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=getattr(settings, 'LLM_BASE_URL', None)
    )
    
    format_instruction = FORMAT_INSTRUCTIONS.get(format_type, FORMAT_INSTRUCTIONS["short"])
    
    prompt = SERIES_PROMPT.format(
        count=count,
        topic=topic,
        channel=channel,
        goal=goal.value if isinstance(goal, GoalEnum) else goal,
        tone=tone.value if isinstance(tone, ToneEnum) else tone
    )
    
    prompt += f"\n\nФормат поста: {format_instruction}"
    
    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Ты — профессиональный контент-маркетолог. Создаёшь серии вовлекающих постов."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
        max_tokens=4000
    )
    
    content = response.choices[0].message.content or "[]"
    return parse_series_response(content, count)


async def generate_series_yandex(
    topic: str,
    channel: str,
    count: int,
    goal: GoalEnum,
    tone: ToneEnum,
    format_type: str = "short"
) -> List[ChannelResult]:
    format_instruction = FORMAT_INSTRUCTIONS.get(format_type, FORMAT_INSTRUCTIONS["short"])
    
    prompt = SERIES_PROMPT.format(
        count=count,
        topic=topic,
        channel=channel,
        goal=goal.value if isinstance(goal, GoalEnum) else goal,
        tone=tone.value if isinstance(tone, ToneEnum) else tone
    )
    
    prompt += f"\n\nФормат поста: {format_instruction}"
    
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
                    "temperature": 0.8,
                    "maxTokens": 4000
                },
                "messages": [
                    {"role": "system", "text": "Ты — профессиональный контент-маркетолог. Создаёшь серии вовлекающих постов."},
                    {"role": "user", "text": prompt}
                ]
            },
            timeout=60.0
        )
        content = response.json()["result"]["alternatives"][0]["message"]["text"]
        return parse_series_response(content, count)


def generate_mock_series(topic: str, channel: str, count: int) -> List[ChannelResult]:
    posts = []
    for i in range(count):
        posts.append(ChannelResult(
            headline=f"Пост {i+1}: {topic[:30]}...",
            body=f"Содержание поста {i+1} на тему '{topic}'. Здесь будет интересный и полезный контент.",
            cta="Подробнее в следующем посте!" if i < count - 1 else "Подпишись!",
            hashtags=["#контент", f"#часть{i+1}"],
            score=8.0,
            improvements=["Добавьте больше деталей"]
        ))
    return posts


def parse_series_response(content: str, count: int) -> List[ChannelResult]:
    try:
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        raw_posts = json.loads(content.strip())
        
        if not isinstance(raw_posts, list):
            raw_posts = [raw_posts]
        
        posts = []
        for p in raw_posts[:count]:
            if isinstance(p, str):
                posts.append(ChannelResult(body=p, score=7.0))
            elif isinstance(p, dict):
                posts.append(ChannelResult(
                    headline=p.get("headline"),
                    body=p.get("body", ""),
                    cta=p.get("cta"),
                    hashtags=p.get("hashtags"),
                    score=float(p.get("score", 7.0)),
                    improvements=p.get("improvements")
                ))
        
        while len(posts) < count:
            posts.append(ChannelResult(
                body=f"Пост {len(posts) + 1}",
                score=5.0
            ))
        
        return posts
    except Exception as e:
        print(f"Error parsing series: {e}")
        return [ChannelResult(body="Ошибка генерации", score=0) for _ in range(count)]


async def generate_series(
    topic: str,
    channel: str,
    count: int,
    goal: GoalEnum = GoalEnum.SALES,
    tone: ToneEnum = ToneEnum.FRIENDLY,
    format_type: str = "short"
) -> List[ChannelResult]:
    if settings.MOCK_MODE:
        return generate_mock_series(topic, channel, count)
    
    try:
        if settings.LLM_PROVIDER == "yandex" and settings.YANDEX_API_KEY:
            return await generate_series_yandex(topic, channel, count, goal, tone, format_type)
        elif settings.OPENAI_API_KEY:
            return await generate_series_openai(topic, channel, count, goal, tone, format_type)
        else:
            return generate_mock_series(topic, channel, count)
    except Exception as e:
        print(f"Error generating series: {e}")
        return generate_mock_series(topic, channel, count)
