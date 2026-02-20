from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Dict, Any
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Generation, BrandVoice, BrandVoiceExample
from app.schemas.schemas import (
    UserCreate, UserResponse, UserLogin, Token,
    GenerateRequest, GenerateResponse, GenerationHistory,
    BrandVoiceUpdate, BrandVoiceResponse, SaveGenerationRequest,
    MessageResponse, ChannelResult, ImproveRequest, ImproveResponse,
    BrandVoiceExampleCreate, BrandVoiceExampleResponse, BrandVoiceAnalyzeRequest, BrandVoiceAnalyzeResponse,
    HashtagsRequest, HashtagsResponse, SeriesRequest, SeriesResponse,
    ContentPlanRequest, ContentPlanResponse, AudienceAnalysisRequest, AudienceAnalysisResponse,
    ImageGenerateRequest, ImageGenerateResponse,
    ImageSettingsUpdate, ImageSettingsResponse
)
from app.services.auth import (
    create_user, authenticate_user, create_access_token,
    get_user_by_id, get_user_by_email, decode_token
)
from app.services.generator import generate_content

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = decode_token(token)
    if token_data is None or token_data.user_id is None:
        raise credentials_exception
    user = await get_user_by_id(db, token_data.user_id)
    if user is None:
        raise credentials_exception
    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    user = await create_user(db, user_data)
    return user


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    user = await authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login/form", response_model=Token)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/generate", response_model=GenerateResponse)
async def generate(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    valid_channels = {"Директ", "Telegram", "Email", "VK", "Дзен"}
    for ch in request.channels:
        if ch not in valid_channels:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid channel: {ch}"
            )
    
    results = await generate_content(request, db)
    
    results_dict: Dict[str, List[Dict[str, Any]]] = {}
    for channel, variants in results.items():
        results_dict[channel] = [v.model_dump() for v in variants]
    
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
    
    return GenerateResponse(results=results_dict, generation_id=generation.id)


@router.get("/history", response_model=List[GenerationHistory])
async def get_history(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Generation)
        .where(Generation.user_id == current_user.id)
        .order_by(desc(Generation.created_at))
        .offset(offset)
        .limit(limit)
    )
    generations = result.scalars().all()
    return [GenerationHistory(
        id=g.id,
        description=g.description,
        channels=g.channels,
        variants=g.variants,
        num_variants=g.num_variants,
        is_saved=bool(g.is_saved),
        created_at=g.created_at
    ) for g in generations]


@router.post("/history/{generation_id}/save", response_model=MessageResponse)
async def save_generation(
    generation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Generation)
        .where(Generation.id == generation_id, Generation.user_id == current_user.id)
    )
    generation = result.scalar_one_or_none()
    if not generation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation not found"
        )
    generation.is_saved = 1
    await db.commit()
    return MessageResponse(message="Generation saved successfully")


@router.delete("/history/{generation_id}", response_model=MessageResponse)
async def delete_generation(
    generation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Generation)
        .where(Generation.id == generation_id, Generation.user_id == current_user.id)
    )
    generation = result.scalar_one_or_none()
    if not generation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation not found"
        )
    await db.delete(generation)
    await db.commit()
    return MessageResponse(message="Generation deleted successfully")


@router.get("/brandvoice", response_model=List[BrandVoiceResponse])
async def get_brandvoice(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BrandVoice))
    brandvoices = result.scalars().all()
    return brandvoices


@router.put("/brandvoice", response_model=BrandVoiceResponse)
async def update_brandvoice(
    data: BrandVoiceUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BrandVoice).where(BrandVoice.channel == data.channel)
    )
    brandvoice = result.scalar_one_or_none()
    
    if brandvoice:
        brandvoice.content = data.content
        brandvoice.examples = data.examples
    else:
        brandvoice = BrandVoice(
            channel=data.channel,
            content=data.content,
            examples=data.examples
        )
        db.add(brandvoice)
    
    await db.commit()
    await db.refresh(brandvoice)
    return brandvoice


@router.post("/improve/{action}", response_model=ImproveResponse)
async def improve_text(
    action: str,
    data: ImproveRequest,
    current_user: User = Depends(get_current_user)
):
    from app.services.improver import improve_text as do_improve, ImproveAction
    
    try:
        improve_action = ImproveAction(action)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action. Valid values: shorten, emoji, tone, cta"
        )
    
    improved = await do_improve(
        text=data.text,
        action=improve_action,
        channel=data.channel,
        target_tone=data.target_tone
    )
    
    return ImproveResponse(
        original_text=data.text,
        improved_text=improved,
        action=action
    )


@router.get("/brand-voice/examples", response_model=List[BrandVoiceExampleResponse])
async def get_brand_voice_examples(
    channel: str = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(BrandVoiceExample)
    
    if channel:
        query = query.where(BrandVoiceExample.channel == channel)
    
    query = query.order_by(BrandVoiceExample.created_at.desc())
    
    result = await db.execute(query)
    examples = result.scalars().all()
    return examples


@router.post("/brand-voice/examples", response_model=BrandVoiceExampleResponse)
async def create_brand_voice_example(
    data: BrandVoiceExampleCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    example = BrandVoiceExample(
        user_id=current_user.id,
        channel=data.channel,
        original_text=data.original_text
    )
    
    db.add(example)
    await db.commit()
    await db.refresh(example)
    
    return example


@router.delete("/brand-voice/examples/{example_id}", response_model=MessageResponse)
async def delete_brand_voice_example(
    example_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BrandVoiceExample).where(BrandVoiceExample.id == example_id)
    )
    example = result.scalar_one_or_none()
    
    if not example:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Example not found"
        )
    
    await db.delete(example)
    await db.commit()
    
    return MessageResponse(message="Example deleted successfully")


@router.post("/brand-voice/analyze", response_model=BrandVoiceAnalyzeResponse)
async def analyze_brand_voice(
    data: BrandVoiceAnalyzeRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.brand_analyzer import analyze_brand_voice as do_analyze
    
    result = await do_analyze(
        db=db,
        user_id=current_user.id,
        channel=data.channel,
        example_ids=data.example_ids
    )
    
    return result


@router.post("/hashtags/generate", response_model=HashtagsResponse)
async def generate_hashtags(
    data: HashtagsRequest,
    current_user: User = Depends(get_current_user)
):
    from app.services.hashtags import generate_hashtags as do_generate
    
    result = await do_generate(
        text=data.text,
        channel=data.channel,
        count=data.count
    )
    
    return HashtagsResponse(**result)


@router.post("/series/generate", response_model=SeriesResponse)
async def generate_series(
    data: SeriesRequest,
    current_user: User = Depends(get_current_user)
):
    from app.services.series import generate_series as do_generate
    
    posts = await do_generate(
        topic=data.topic,
        channel=data.channel,
        count=data.count,
        goal=data.goal,
        tone=data.tone
    )
    
    return SeriesResponse(topic=data.topic, posts=posts)


@router.post("/content-plan/generate", response_model=ContentPlanResponse)
async def generate_content_plan(
    data: ContentPlanRequest,
    current_user: User = Depends(get_current_user)
):
    from app.services.content_plan import generate_content_plan as do_generate
    
    plan = await do_generate(
        product=data.product,
        days=data.duration_days,
        channels=data.channels,
        goal=data.goal
    )
    
    return ContentPlanResponse(plan=plan)


@router.post("/audience/analyze", response_model=AudienceAnalysisResponse)
async def analyze_audience(
    data: AudienceAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    from app.services.audience import analyze_audience as do_analyze
    
    result = await do_analyze(
        product=data.product,
        description=data.description
    )
    
    return result


@router.post("/media/generate-image", response_model=ImageGenerateResponse)
async def generate_image(
    data: ImageGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.media import generate_image as do_generate
    
    result = await do_generate(
        prompt=data.prompt,
        channel=data.channel,
        db=db
    )
    
    return result


@router.get("/image-settings", response_model=ImageSettingsResponse)
async def get_image_settings(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.media import get_image_settings as do_get
    return await do_get(db)


@router.put("/image-settings", response_model=ImageSettingsResponse)
async def update_image_settings(
    data: ImageSettingsUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.media import get_image_settings as do_get
    
    img_settings = await do_get(db)
    
    if data.api_key is not None:
        img_settings.api_key = data.api_key
    if data.model is not None:
        img_settings.model = data.model
    if data.enabled is not None:
        img_settings.enabled = data.enabled
    
    await db.commit()
    await db.refresh(img_settings)
    
    # Mask API key in response
    response_data = {
        "id": img_settings.id,
        "api_key": f"{img_settings.api_key[:10]}..." if img_settings.api_key else None,
        "model": img_settings.model,
        "enabled": img_settings.enabled,
        "updated_at": img_settings.updated_at
    }
    
    return ImageSettingsResponse(**response_data)
