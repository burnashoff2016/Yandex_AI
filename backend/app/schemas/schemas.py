from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class GoalEnum(str, Enum):
    SALES = "продажа"
    AWARENESS = "узнаваемость"
    ENGAGEMENT = "вовлечение"
    ANNOUNCEMENT = "анонс"


class ToneEnum(str, Enum):
    FORMAL = "формальный"
    FRIENDLY = "дружелюбный"
    BOLD = "дерзкий"
    EXPERT = "экспертный"


class PostFormatEnum(str, Enum):
    SHORT = "short"
    LONGREAD = "longread"
    CASE_STUDY = "case_study"
    STORY = "story"


class GenerateRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=1000)
    channels: List[str] = Field(..., min_length=1)
    num_variants: int = Field(1, ge=1, le=3)
    goal: GoalEnum = GoalEnum.SALES
    tone: Optional[ToneEnum] = ToneEnum.FRIENDLY
    audience: Optional[str] = Field(None, max_length=500)
    offer: Optional[str] = Field(None, max_length=200)
    format: Optional[PostFormatEnum] = PostFormatEnum.SHORT


class ChannelResult(BaseModel):
    headline: Optional[str] = None
    body: str
    cta: Optional[str] = None
    hashtags: Optional[List[str]] = None
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    score: float = Field(..., ge=0, le=10)
    improvements: Optional[List[str]] = None


class GenerateResponse(BaseModel):
    results: Dict[str, List[ChannelResult]]
    generation_id: Optional[int] = None


class GenerationHistory(BaseModel):
    id: int
    description: str
    channels: List[str]
    variants: Dict[str, List[Any]]
    num_variants: int
    is_saved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BrandVoiceUpdate(BaseModel):
    channel: str
    content: str
    examples: Optional[List[str]] = None


class BrandVoiceResponse(BaseModel):
    id: int
    channel: str
    content: str
    examples: Optional[List[str]]
    updated_at: datetime

    class Config:
        from_attributes = True


class SaveGenerationRequest(BaseModel):
    generation_id: int


class MessageResponse(BaseModel):
    message: str


class ImproveAction(str, Enum):
    SHORTEN = "shorten"
    EMOJI = "emoji"
    TONE = "tone"
    CTA = "cta"


class ImproveRequest(BaseModel):
    text: str = Field(..., min_length=10)
    channel: str
    action: ImproveAction
    target_tone: Optional[str] = None


class ImproveResponse(BaseModel):
    original_text: str
    improved_text: str
    action: str


class ScheduledPostCreate(BaseModel):
    generation_id: Optional[int] = None
    channel: str
    content: Dict[str, Any]
    scheduled_date: datetime
    timezone: str = "Europe/Moscow"


class ScheduledPostUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    timezone: Optional[str] = None
    status: Optional[str] = None


class ScheduledPostResponse(BaseModel):
    id: int
    channel: str
    content: Dict[str, Any]
    scheduled_date: datetime
    timezone: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class BrandVoiceExampleCreate(BaseModel):
    channel: str
    original_text: str = Field(..., min_length=20)


class BrandVoiceExampleResponse(BaseModel):
    id: int
    channel: str
    original_text: str
    created_at: datetime

    class Config:
        from_attributes = True


class BrandVoiceAnalyzeRequest(BaseModel):
    channel: str
    example_ids: Optional[List[int]] = None


class BrandVoiceAnalyzeResponse(BaseModel):
    channel: str
    generated_guideline: str
    examples_count: int


class HashtagsRequest(BaseModel):
    text: str = Field(..., min_length=10)
    channel: str
    count: int = Field(5, ge=3, le=15)


class HashtagsResponse(BaseModel):
    hashtags: List[str]
    selling_hashtags: List[str]


class SeriesRequest(BaseModel):
    topic: str = Field(..., min_length=10, max_length=500)
    channel: str
    count: int = Field(3, ge=2, le=10)
    goal: Optional[GoalEnum] = GoalEnum.SALES
    tone: Optional[ToneEnum] = ToneEnum.FRIENDLY


class SeriesResponse(BaseModel):
    topic: str
    posts: List[ChannelResult]


class ContentPlanRequest(BaseModel):
    product: str = Field(..., min_length=10, max_length=500)
    duration_days: int = Field(7, ge=3, le=30)
    channels: List[str] = Field(..., min_length=1)
    goal: Optional[GoalEnum] = GoalEnum.SALES


class ContentPlanItem(BaseModel):
    day: int
    date: str
    topic: str
    channel: str
    draft: ChannelResult


class ContentPlanResponse(BaseModel):
    plan: List[ContentPlanItem]


class AudienceAnalysisRequest(BaseModel):
    product: str = Field(..., min_length=10, max_length=500)
    description: Optional[str] = Field(None, max_length=1000)


class AudienceAnalysisResponse(BaseModel):
    age_range: str
    gender: str
    interests: List[str]
    pains: List[str]
    triggers: List[str]
    channels: List[str]
    content_preferences: List[str]


class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=5, max_length=500)
    channel: str


class ImageGenerateResponse(BaseModel):
    image_url: str
    prompt: str


class ImageSettingsUpdate(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = None
    enabled: Optional[bool] = None


class ImageSettingsResponse(BaseModel):
    id: int
    api_key: Optional[str]
    model: str
    enabled: bool
    updated_at: datetime

    class Config:
        from_attributes = True
