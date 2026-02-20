import httpx
from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.schemas import ImproveAction


ACTION_PROMPTS = {
    ImproveAction.SHORTEN: """Сократи текст, сохранив главный смысл и CTA.
Убери лишние слова, сделай текст лаконичнее.
Оставь только ключевые моменты.
Верни ТОЛЬКО сокращённый текст без объяснений.""",

    ImproveAction.EMOJI: """Добавь 2-4 подходящих эмодзи в текст.
Расставь эмодзи органично, не перегружай.
Эмодзи должны соответствовать контексту.
Верни ТОЛЬКО текст с эмодзи без объяснений.""",

    ImproveAction.TONE: """Измени тон текста на {target_tone}.
Перепиши текст, сохраняя смысл, но изменив стиль.
Верни ТОЛЬКО переписанный текст без объяснений.""",

    ImproveAction.CTA: """Улучши призыв к действию (CTA) в тексте.
Сделай CTA более убедительным и конкретным.
Добавь срочность или выгоду, если уместно.
Верни ТОЛЬКО текст с улучшенным CTA без объяснений."""
}

CHANNEL_CONSTRAINTS = {
    "Директ": "Длина заголовка до 35 символов, текст до 81 символа.",
    "Telegram": "Длина до 800 символов, можно использовать эмодзи.",
    "Email": "Тема до 50 символов, текст до 500 символов.",
    "VK": "Длина до 500 символов, можно использовать эмодзи."
}


async def improve_with_openai(prompt: str, text: str, channel: str) -> str:
    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=getattr(settings, 'LLM_BASE_URL', None)
    )
    
    channel_constraint = CHANNEL_CONSTRAINTS.get(channel, "")
    
    full_prompt = f"""{prompt}

Ограничения канала: {channel_constraint}

Исходный текст:
{text}"""
    
    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Ты — профессиональный копирайтер. Улучшаешь маркетинговые тексты для российских каналов."},
            {"role": "user", "content": full_prompt}
        ],
        temperature=0.7,
        max_tokens=1000
    )
    
    return response.choices[0].message.content or text


async def improve_with_yandex(prompt: str, text: str, channel: str) -> str:
    channel_constraint = CHANNEL_CONSTRAINTS.get(channel, "")
    
    full_prompt = f"""{prompt}

Ограничения канала: {channel_constraint}

Исходный текст:
{text}"""
    
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
                    "maxTokens": 1000
                },
                "messages": [
                    {"role": "system", "text": "Ты — профессиональный копирайтер. Улучшаешь маркетинговые тексты для российских каналов."},
                    {"role": "user", "text": full_prompt}
                ]
            },
            timeout=30.0
        )
        response.raise_for_status()
        data = response.json()
        return data["result"]["alternatives"][0]["message"]["text"]


def mock_improve(text: str, action: ImproveAction, target_tone: str = None) -> str:
    if action == ImproveAction.SHORTEN:
        words = text.split()
        if len(words) > 10:
            return " ".join(words[:len(words)//2]) + "..."
        return text
    
    if action == ImproveAction.EMOJI:
        emojis = ["🔥", "✨", "🚀", "💡", "👍", "🎉"]
        import random
        result = text
        for _ in range(2):
            pos = random.randint(0, len(result))
            result = result[:pos] + random.choice(emojis) + result[pos:]
        return result
    
    if action == ImproveAction.TONE:
        tone_marker = f"[{target_tone or 'экспертный'} тон] "
        return tone_marker + text
    
    if action == ImproveAction.CTA:
        if "!" not in text:
            return text + " Закажите сейчас!"
        return text
    
    return text


async def improve_text(
    text: str,
    action: ImproveAction,
    channel: str,
    target_tone: str = None
) -> str:
    if settings.MOCK_MODE:
        return mock_improve(text, action, target_tone)
    
    prompt = ACTION_PROMPTS.get(action, ACTION_PROMPTS[ImproveAction.SHORTEN])
    
    if action == ImproveAction.TONE and target_tone:
        prompt = prompt.format(target_tone=target_tone)
    
    try:
        if settings.LLM_PROVIDER == "yandex" and settings.YANDEX_API_KEY:
            return await improve_with_yandex(prompt, text, channel)
        elif settings.OPENAI_API_KEY:
            return await improve_with_openai(prompt, text, channel)
        else:
            return mock_improve(text, action, target_tone)
    except Exception as e:
        print(f"Error improving text: {e}")
        return mock_improve(text, action, target_tone)
