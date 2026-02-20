import json
from typing import Dict, List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from openai import AsyncOpenAI
import httpx
from app.core.config import settings
from app.models.models import BrandVoice
from app.schemas.schemas import GenerateRequest, GoalEnum, ToneEnum, ChannelResult


SYSTEM_PROMPT = """Ты — профессиональный SMM-специалист и маркетолог с 10-летним опытом. Создаёшь продающие тексты для российских маркетинговых каналов.

ПРИНЦИПЫ:
- Пиши на русском, естественно и живо
- Используй триггеры: срочность, эксклюзивность, страх упустить
- Всегда включай призыв к действию (CTA)
- Оценивай качество текста от 1 до 10
- Давай 1-2 рекомендации по улучшению
- Всегда добавляй продающие хештеги для Telegram, VK, Дзен

ФОРМАТЫ:

ЯНДЕКС.ДИРЕКТ: заголовок до 35 символов | текст до 81 символа. Лаконично, цифры, выгода.

TELEGRAM: до 800 символов, 2-4 эмодзи, живой стиль, в конце хештеги. Дружелюбно.

EMAIL: тема до 50 символов, текст до 500 символов. Вежливо, персонализированно.

VK: до 500 символов, эмодзи, вопросы к аудитории, хештеги. Разговорный стиль.

ДЗЕН: заголовок интригующий до 80 символов, текст-лонгрид 500-1500 символов, подзаголовки, промпт для изображения, хештеги."""


FORMAT_INSTRUCTIONS = {
    "short": "ФОРМАТ: Короткий пост до 200 слов. Лаконично, по делу, один ключевой месседж.",
    "longread": "ФОРМАТ: Лонгрид 500-1000 слов. Развёрнутый материал с подзаголовками, примерами, выводами.",
    "case_study": "ФОРМАТ: Кейс. Структура: Проблема → Решение → Результат. Цифры, факты, доказательства.",
    "story": "ФОРМАТ: История. Завязка → Развитие → Кульминация → Финал. Эмоции, личный опыт."
}


GOAL_INSTRUCTIONS = {
    GoalEnum.SALES: "ЦЕЛЬ: Продажа. Фокус на выгоде, скидках, ограничении времени, CTA на покупку.",
    GoalEnum.AWARENESS: "ЦЕЛЬ: Узнаваемость. Фокус на уникальности, эмоциях, истории бренда.",
    GoalEnum.ENGAGEMENT: "ЦЕЛЬ: Вовлечение. Фокус на вопросах, интерактиве, обсуждении.",
    GoalEnum.ANNOUNCEMENT: "ЦЕЛЬ: Анонс. Фокус на что/где/когда, почему важно участвовать."
}


TONE_INSTRUCTIONS = {
    ToneEnum.FORMAL: "ТОН: Формальный, профессиональный.",
    ToneEnum.FRIENDLY: "ТОН: Дружелюбный, тёплый.",
    ToneEnum.BOLD: "ТОН: Дерзкий, смелый, с юмором.",
    ToneEnum.EXPERT: "ТОН: Экспертный, авторитетный, с фактами."
}


def build_prompt(
    request: GenerateRequest,
    brand_voice: str = "Профессиональный, но дружелюбный стиль."
) -> str:
    from app.schemas.schemas import PostFormatEnum
    
    variants_hint = f"по {request.num_variants} варианта" if request.num_variants > 1 else "вариант"
    
    goal_instruction = GOAL_INSTRUCTIONS.get(request.goal, GOAL_INSTRUCTIONS[GoalEnum.SALES])
    tone_instruction = TONE_INSTRUCTIONS.get(request.tone, TONE_INSTRUCTIONS[ToneEnum.FRIENDLY])
    
    audience_text = f"\nЦА: {request.audience}" if request.audience else ""
    offer_text = f"\nОффер: {request.offer}" if request.offer else ""
    
    format_instruction = ""
    if request.format and request.format != PostFormatEnum.SHORT:
        format_instruction = f"\n{FORMAT_INSTRUCTIONS.get(request.format.value if hasattr(request.format, 'value') else request.format, '')}"
    
    channels_list = ", ".join(request.channels)
    
    prompt = f"""{goal_instruction}
{tone_instruction}{audience_text}{offer_text}{format_instruction}

Стиль бренда: {brand_voice}

ЗАДАЧА: Сгенерируй {variants_hint} текста для каналов: {channels_list}

Продукт/акция:
{request.description}

ВЕРНИ JSON (только JSON, без markdown):
{{
  "Директ": [
    {{"headline": "...", "body": "...", "cta": "...", "score": 8.5, "improvements": ["..."]}}
  ],
  "Telegram": [
    {{"body": "...", "hashtags": ["#..."], "cta": "...", "score": 9.0, "improvements": ["..."]}}
  ],
  "Email": [
    {{"headline": "тема", "body": "...", "cta": "...", "score": 8.0, "improvements": ["..."]}}
  ],
  "VK": [
    {{"body": "...", "hashtags": ["#..."], "cta": "...", "score": 8.5, "improvements": ["..."]}}
  ],
  "Дзен": [
    {{"headline": "интригующий заголовок", "body": "лонгрид текст...", "image_prompt": "описание для картинки", "hashtags": ["#..."], "cta": "...", "score": 8.5, "improvements": ["..."]}}
  ]
}}

Важно:
- Верни только запрошенные каналы
- Для каждого канала ровно {request.num_variants} вариант(а) в массиве
- score от 1 до 10
- improvements — 1-2 рекомендации
- Варианты должны отличаться!
- Для Telegram, VK, Дзен обязательно добавь 3-5 продающих хештегов
- Для Дзен добавь image_prompt — описание для генерации картинки"""

    return prompt


def parse_llm_response(response_text: str, channels: List[str], num_variants: int) -> Dict[str, List[ChannelResult]]:
    try:
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        raw_result = json.loads(response_text.strip())
        
        result: Dict[str, List[ChannelResult]] = {}
        
        for channel in channels:
            channel_data = None
            for key in raw_result:
                if channel.lower() in key.lower() or key.lower() in channel.lower():
                    channel_data = raw_result[key]
                    break
            
            if channel_data is None:
                result[channel] = [ChannelResult(
                    body=f"Не удалось сгенерировать текст для {channel}",
                    score=0,
                    improvements=["Попробуйте перегенерировать"]
                ) for _ in range(num_variants)]
                continue
            
            if not isinstance(channel_data, list):
                channel_data = [channel_data]
            
            parsed_variants = []
            for v in channel_data[:num_variants]:
                if isinstance(v, str):
                    parsed_variants.append(ChannelResult(body=v, score=7.0))
                elif isinstance(v, dict):
                    parsed_variants.append(ChannelResult(
                        headline=v.get("headline"),
                        body=v.get("body", v.get("text", "")),
                        cta=v.get("cta"),
                        hashtags=v.get("hashtags"),
                        image_prompt=v.get("image_prompt"),
                        score=float(v.get("score", 7.0)),
                        improvements=v.get("improvements")
                    ))
            
            while len(parsed_variants) < num_variants:
                parsed_variants.append(ChannelResult(
                    body=f"Вариант {len(parsed_variants) + 1}",
                    score=5.0,
                    improvements=["Дополнительный вариант"]
                ))
            
            result[channel] = parsed_variants
        
        return result
        
    except json.JSONDecodeError as e:
        return {ch: [ChannelResult(
            body="Ошибка парсинга. Попробуйте ещё раз.",
            score=0,
            improvements=[f"Ошибка: {str(e)[:50]}"]
        ) for _ in range(num_variants)] for ch in channels}
    except Exception as e:
        return {ch: [ChannelResult(
            body="Ошибка генерации. Попробуйте ещё раз.",
            score=0,
            improvements=[str(e)[:50]]
        ) for _ in range(num_variants)] for ch in channels}


async def get_brand_voice(db: AsyncSession, channel: Optional[str] = None) -> str:
    if channel:
        result = await db.execute(select(BrandVoice).where(BrandVoice.channel == channel))
        brand_voice = result.scalar_one_or_none()
        if brand_voice:
            return brand_voice.content
    
    result = await db.execute(select(BrandVoice).where(BrandVoice.channel == "general"))
    brand_voice = result.scalar_one_or_none()
    if brand_voice:
        return brand_voice.content
    
    return "Профессиональный, но дружелюбный стиль."


async def generate_with_openai(prompt: str) -> str:
    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=getattr(settings, 'LLM_BASE_URL', None)
    )
    
    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
        max_tokens=4000
    )
    
    return response.choices[0].message.content or ""


async def generate_with_yandex(prompt: str) -> str:
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
                    {"role": "system", "text": SYSTEM_PROMPT},
                    {"role": "user", "text": prompt}
                ]
            },
            timeout=60.0
        )
        response.raise_for_status()
        data = response.json()
        return data["result"]["alternatives"][0]["message"]["text"]


def generate_mock_response(request: GenerateRequest) -> Dict[str, List[ChannelResult]]:
    mock_data: Dict[str, List[ChannelResult]] = {}
    
    for channel in request.channels:
        variants = []
        for i in range(request.num_variants):
            if channel == "Директ":
                variants.append(ChannelResult(
                    headline=f"Скидка {20 + i*10}%!",
                    body=f"Только сегодня. Вариант {i+1}",
                    cta="Заказать",
                    score=8.0 + i * 0.5,
                    improvements=["Добавьте дедлайн"]
                ))
            elif channel == "Telegram":
                variants.append(ChannelResult(
                    body=f"🔥 Вариант {i+1}! Отличные новости!\n\nПодробности по ссылке 👇",
                    hashtags=["#акция", "#скидки"],
                    cta="Подробнее",
                    score=8.5 + i * 0.3,
                    improvements=["Добавьте эмодзи"]
                ))
            elif channel == "Email":
                variants.append(ChannelResult(
                    headline=f"Вариант {i+1}: Эксклюзивное предложение",
                    body="Уважаемый клиент! Рады предложить вам...",
                    cta="Получить",
                    score=7.5 + i * 0.5,
                    improvements=["Персонализируйте"]
                ))
            elif channel == "VK":
                variants.append(ChannelResult(
                    body=f"🎉 Вариант {i+1} для подписчиков!\n\nПишите в комментариях! 👇",
                    hashtags=["#акция", "#длясвоих"],
                    cta="Участвовать",
                    score=8.0 + i * 0.4,
                    improvements=["Добавьте вопрос"]
                ))
            elif channel == "Дзен":
                variants.append(ChannelResult(
                    headline=f"Вариант {i+1}: Заголовок, который привлекает внимание",
                    body=f"Это длинный текст для Яндекс.Дзен. Здесь подробно рассказываем о преимуществах продукта и почему стоит выбрать именно его.\n\nОсобенности и преимущества:\n• Первое преимущество\n• Второе преимущество\n• Третье преимущество\n\nЗакажите прямо сейчас!",
                    image_prompt=f"Professional marketing image for social media, product showcase, modern style, variant {i+1}",
                    hashtags=["#продукт", "#преимущества"],
                    cta="Подробнее",
                    score=8.5 + i * 0.3,
                    improvements=["Добавьте личную историю"]
                ))
        mock_data[channel] = variants
    
    return mock_data


async def generate_content(
    request: GenerateRequest,
    db: AsyncSession
) -> Dict[str, List[ChannelResult]]:
    if settings.MOCK_MODE:
        return generate_mock_response(request)
    
    brand_voice = await get_brand_voice(db)
    prompt = build_prompt(request, brand_voice)
    
    try:
        if settings.LLM_PROVIDER == "yandex" and settings.YANDEX_API_KEY:
            response_text = await generate_with_yandex(prompt)
        elif settings.OPENAI_API_KEY:
            response_text = await generate_with_openai(prompt)
        else:
            return generate_mock_response(request)
        
        results = parse_llm_response(response_text, request.channels, request.num_variants)
        
        for channel, variants in results.items():
            for i, variant in enumerate(variants):
                if variant.image_prompt:
                    try:
                        from app.services.media import generate_image
                        image_response = await generate_image(variant.image_prompt, channel, db)
                        results[channel][i] = ChannelResult(
                            headline=variant.headline,
                            body=variant.body,
                            cta=variant.cta,
                            hashtags=variant.hashtags,
                            image_prompt=variant.image_prompt,
                            image_url=image_response.image_url,
                            score=variant.score,
                            improvements=variant.improvements
                        )
                    except Exception as e:
                        print(f"Image generation failed for {channel}: {e}")
        
        return results
    except Exception as e:
        print(f"Error generating content: {e}")
        return generate_mock_response(request)
