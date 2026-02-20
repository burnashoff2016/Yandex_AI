import json
from typing import List
from openai import AsyncOpenAI
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.models import BrandVoiceExample, BrandVoice
from app.schemas.schemas import BrandVoiceAnalyzeResponse


ANALYZE_PROMPT = """Проанализируй следующие примеры текстов и создай детальный гайдлайн по стилю бренда.

Примеры текстов:
{examples}

Верни JSON со следующей структурой (только JSON, без markdown):
{{
  "tone": "описание тона коммуникации",
  "vocabulary": ["типичные слова и фразы"],
  "sentence_structure": "особенности построения предложений",
  "emoji_usage": "как используются эмодзи",
  "cta_style": "тиичный стиль призывов к действию",
  "length_preference": "предпочтительная длина текстов",
  "key_phrases": ["ключевые фразы бренда"],
  "avoid": ["чего следует избегать"],
  "summary": "краткое резюме стиля в 2-3 предложениях"
}}"""


async def analyze_with_openai(examples: List[str]) -> dict:
    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=getattr(settings, 'LLM_BASE_URL', None)
    )
    
    examples_text = "\n\n---\n\n".join([f"Пример {i+1}:\n{ex}" for i, ex in enumerate(examples)])
    prompt = ANALYZE_PROMPT.format(examples=examples_text)
    
    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Ты — эксперт по бренд-коммуникациям. Анализируешь стиль текстов и создаёшь гайдлайны."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=2000
    )
    
    content = response.choices[0].message.content or "{}"
    
    try:
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        return json.loads(content.strip())
    except json.JSONDecodeError:
        return {"summary": content, "tone": "Не удалось определить", "vocabulary": []}


async def analyze_with_yandex(examples: List[str]) -> dict:
    examples_text = "\n\n---\n\n".join([f"Пример {i+1}:\n{ex}" for i, ex in enumerate(examples)])
    prompt = ANALYZE_PROMPT.format(examples=examples_text)
    
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
                    "maxTokens": 2000
                },
                "messages": [
                    {"role": "system", "text": "Ты — эксперт по бренд-коммуникациям. Анализируешь стиль текстов и создаёшь гайдлайны."},
                    {"role": "user", "text": prompt}
                ]
            },
            timeout=60.0
        )
        response.raise_for_status()
        data = response.json()
        content = data["result"]["alternatives"][0]["message"]["text"]
        
        try:
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            return json.loads(content.strip())
        except json.JSONDecodeError:
            return {"summary": content, "tone": "Не удалось определить", "vocabulary": []}


def generate_mock_analysis(examples: List[str]) -> dict:
    total_length = sum(len(ex) for ex in examples)
    avg_length = total_length // len(examples) if examples else 100
    
    return {
        "tone": "Профессиональный и дружелюбный",
        "vocabulary": ["эксклюзивно", "специально для вас", "только сегодня"],
        "sentence_structure": "Короткие предложения с чёткими призывами к действию",
        "emoji_usage": "Умеренное использование, 1-3 эмодзи на текст",
        "cta_style": "Прямые призывы: 'Закажите', 'Узнайте подробнее'",
        "length_preference": f"Средняя длина ~{avg_length} символов",
        "key_phrases": ["не упустите", "специальное предложение"],
        "avoid": ["сложный жаргон", "длинные абзацы"],
        "summary": f"Проанализировано {len(examples)} примеров. Стиль: профессиональный с элементами дружелюбности."
    }


async def get_examples_from_db(
    db: AsyncSession,
    user_id: int,
    channel: str,
    example_ids: List[int] = None
) -> List[BrandVoiceExample]:
    query = select(BrandVoiceExample).where(
        BrandVoiceExample.user_id == user_id,
        BrandVoiceExample.channel == channel
    )
    
    if example_ids:
        query = query.where(BrandVoiceExample.id.in_(example_ids))
    
    result = await db.execute(query)
    return result.scalars().all()


async def analyze_brand_voice(
    db: AsyncSession,
    user_id: int,
    channel: str,
    example_ids: List[int] = None
) -> BrandVoiceAnalyzeResponse:
    examples = await get_examples_from_db(db, user_id, channel, example_ids)
    
    if not examples:
        return BrandVoiceAnalyzeResponse(
            channel=channel,
            generated_guideline="Нет примеров для анализа. Загрузите примеры текстов.",
            examples_count=0
        )
    
    texts = [ex.original_text for ex in examples]
    
    if settings.MOCK_MODE:
        analysis = generate_mock_analysis(texts)
    else:
        try:
            if settings.LLM_PROVIDER == "yandex" and settings.YANDEX_API_KEY:
                analysis = await analyze_with_yandex(texts)
            elif settings.OPENAI_API_KEY:
                analysis = await analyze_with_openai(texts)
            else:
                analysis = generate_mock_analysis(texts)
        except Exception as e:
            print(f"Error analyzing brand voice: {e}")
            analysis = generate_mock_analysis(texts)
    
    guideline = format_guideline(analysis)
    
    existing = await db.execute(
        select(BrandVoice).where(BrandVoice.channel == channel)
    )
    brand_voice = existing.scalar_one_or_none()
    
    if brand_voice:
        brand_voice.content = guideline
        brand_voice.examples = texts
    else:
        brand_voice = BrandVoice(
            channel=channel,
            content=guideline,
            examples=texts
        )
        db.add(brand_voice)
    
    await db.commit()
    
    return BrandVoiceAnalyzeResponse(
        channel=channel,
        generated_guideline=guideline,
        examples_count=len(examples)
    )


def format_guideline(analysis: dict) -> str:
    parts = []
    
    if summary := analysis.get("summary"):
        parts.append(f"## Общее описание\n{summary}")
    
    if tone := analysis.get("tone"):
        parts.append(f"\n## Тон коммуникации\n{tone}")
    
    if vocabulary := analysis.get("vocabulary"):
        vocab_list = ", ".join(vocabulary[:10])
        parts.append(f"\n## Типичная лексика\n{vocab_list}")
    
    if sentence_structure := analysis.get("sentence_structure"):
        parts.append(f"\n## Структура предложений\n{sentence_structure}")
    
    if emoji_usage := analysis.get("emoji_usage"):
        parts.append(f"\n## Использование эмодзи\n{emoji_usage}")
    
    if cta_style := analysis.get("cta_style"):
        parts.append(f"\n## Стиль CTA\n{cta_style}")
    
    if key_phrases := analysis.get("key_phrases"):
        phrases_list = ", ".join(key_phrases[:5])
        parts.append(f"\n## Ключевые фразы\n{phrases_list}")
    
    if avoid := analysis.get("avoid"):
        avoid_list = ", ".join(avoid[:5])
        parts.append(f"\n## Избегать\n{avoid_list}")
    
    return "\n".join(parts)
