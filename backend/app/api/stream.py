import json
import asyncio
from typing import Dict, List
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Generation
from app.api.endpoints import get_current_user
from app.schemas.schemas import GenerateRequest, ChannelResult
from app.services.generator import (
    generate_with_openai, generate_with_yandex, generate_mock_response,
    build_prompt, parse_llm_response, get_brand_voice
)

router = APIRouter()


async def add_images_to_variants(variants: List[ChannelResult], channel: str) -> List[ChannelResult]:
    from app.services.media import generate_image
    
    for i, variant in enumerate(variants):
        if variant.image_prompt:
            try:
                image_response = await generate_image(variant.image_prompt, channel)
                variants[i] = ChannelResult(
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
    return variants


async def stream_generate_with_openai(prompt: str, channels: List[str], num_variants: int):
    from openai import AsyncOpenAI
    
    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=getattr(settings, 'LLM_BASE_URL', None)
    )
    
    for channel in channels:
        channel_prompt = f"{prompt}\n\nСгенерируй текст ТОЛЬКО для канала: {channel}"
        
        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": "Ты — профессиональный SMM-специалист. Создаёшь продающие тексты."},
                {"role": "user", "content": channel_prompt}
            ],
            temperature=0.8,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content or ""
        
        try:
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            raw_result = json.loads(content.strip())
            
            if isinstance(raw_result, dict):
                for key in raw_result:
                    if channel.lower() in key.lower():
                        raw_result = raw_result[key]
                        break
            
            if not isinstance(raw_result, list):
                raw_result = [raw_result]
            
            variants = []
            for v in raw_result[:num_variants]:
                if isinstance(v, str):
                    variants.append(ChannelResult(body=v, score=7.0))
                elif isinstance(v, dict):
                    variants.append(ChannelResult(
                        headline=v.get("headline"),
                        body=v.get("body", v.get("text", "")),
                        cta=v.get("cta"),
                        hashtags=v.get("hashtags"),
                        image_prompt=v.get("image_prompt"),
                        score=float(v.get("score", 7.0)),
                        improvements=v.get("improvements")
                    ))
            
            while len(variants) < num_variants:
                variants.append(ChannelResult(body="Дополнительный вариант", score=5.0))
            
            variants = await add_images_to_variants(variants, channel)
            
            yield f"event: channel_complete\ndata: {json.dumps({'channel': channel, 'variants': [v.model_dump() for v in variants]}, ensure_ascii=False)}\n\n"
            
        except (json.JSONDecodeError, Exception) as e:
            yield f"event: channel_complete\ndata: {json.dumps({'channel': channel, 'variants': [{'body': f'Ошибка: {str(e)[:50]}', 'score': 0}]}, ensure_ascii=False)}\n\n"
        
        await asyncio.sleep(0.1)


async def stream_generate_with_yandex(prompt: str, channels: List[str], num_variants: int):
    import httpx
    
    for channel in channels:
        channel_prompt = f"{prompt}\n\nСгенерируй текст ТОЛЬКО для канала: {channel}"
        
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
                        "maxTokens": 2000
                    },
                    "messages": [
                        {"role": "system", "text": "Ты — профессиональный SMM-специалист. Создаёшь продающие тексты."},
                        {"role": "user", "text": channel_prompt}
                    ]
                },
                timeout=60.0
            )
            
            content = response.json()["result"]["alternatives"][0]["message"]["text"]
            
            try:
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                
                raw_result = json.loads(content.strip())
                
                if isinstance(raw_result, dict):
                    for key in raw_result:
                        if channel.lower() in key.lower():
                            raw_result = raw_result[key]
                            break
                
                if not isinstance(raw_result, list):
                    raw_result = [raw_result]
                
                variants = []
                for v in raw_result[:num_variants]:
                    if isinstance(v, str):
                        variants.append(ChannelResult(body=v, score=7.0))
                    elif isinstance(v, dict):
                        variants.append(ChannelResult(
                            headline=v.get("headline"),
                            body=v.get("body", v.get("text", "")),
                            cta=v.get("cta"),
                            hashtags=v.get("hashtags"),
                            image_prompt=v.get("image_prompt"),
                            score=float(v.get("score", 7.0)),
                            improvements=v.get("improvements")
                        ))
                
                while len(variants) < num_variants:
                    variants.append(ChannelResult(body="Дополнительный вариант", score=5.0))
                
                variants = await add_images_to_variants(variants, channel)
                
                yield f"event: channel_complete\ndata: {json.dumps({'channel': channel, 'variants': [v.model_dump() for v in variants]}, ensure_ascii=False)}\n\n"
                
            except (json.JSONDecodeError, Exception) as e:
                yield f"event: channel_complete\ndata: {json.dumps({'channel': channel, 'variants': [{'body': f'Ошибка: {str(e)[:50]}', 'score': 0}]}, ensure_ascii=False)}\n\n"
            
            await asyncio.sleep(0.1)


async def stream_mock_generate(request: GenerateRequest):
    results = generate_mock_response(request)
    
    for channel, variants in results.items():
        variants = await add_images_to_variants(list(variants), channel)
        yield f"event: channel_complete\ndata: {json.dumps({'channel': channel, 'variants': [v.model_dump() for v in variants]}, ensure_ascii=False)}\n\n"
        await asyncio.sleep(0.5)


@router.post("/generate/stream")
async def generate_stream(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    valid_channels = {"Директ", "Telegram", "Email", "VK", "Дзен"}
    for ch in request.channels:
        if ch not in valid_channels:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid channel: {ch}"
            )
    
    async def event_generator():
        results_dict: Dict[str, List[dict]] = {}
        
        if settings.MOCK_MODE:
            async for event in stream_mock_generate(request):
                yield event
                try:
                    data_str = event.split("data: ")[1].strip()
                    data = json.loads(data_str)
                    results_dict[data["channel"]] = data["variants"]
                except:
                    pass
        else:
            brand_voice = await get_brand_voice(db)
            prompt = build_prompt(request, brand_voice)
            
            if settings.LLM_PROVIDER == "yandex" and settings.YANDEX_API_KEY:
                async for event in stream_generate_with_yandex(prompt, request.channels, request.num_variants):
                    yield event
                    try:
                        data_str = event.split("data: ")[1].strip()
                        data = json.loads(data_str)
                        results_dict[data["channel"]] = data["variants"]
                    except:
                        pass
            elif settings.OPENAI_API_KEY:
                async for event in stream_generate_with_openai(prompt, request.channels, request.num_variants):
                    yield event
                    try:
                        data_str = event.split("data: ")[1].strip()
                        data = json.loads(data_str)
                        results_dict[data["channel"]] = data["variants"]
                    except:
                        pass
            else:
                async for event in stream_mock_generate(request):
                    yield event
                    try:
                        data_str = event.split("data: ")[1].strip()
                        data = json.loads(data_str)
                        results_dict[data["channel"]] = data["variants"]
                    except:
                        pass
        
        generation = Generation(
            user_id=current_user.id,
            description=request.description,
            channels=request.channels,
            variants=results_dict,
            num_variants=request.num_variants
        )
        db.add(generation)
        await db.commit()
        await db.refresh(generation)
        
        yield f"event: done\ndata: {json.dumps({'generation_id': generation.id}, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
