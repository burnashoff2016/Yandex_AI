from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Enum as SQLEnum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    generations = relationship("Generation", back_populates="user")


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    description = Column(Text, nullable=False)
    channels = Column(JSON, nullable=False)
    variants = Column(JSON, nullable=False)
    num_variants = Column(Integer, default=1)
    is_saved = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="generations")


class BrandVoice(Base):
    __tablename__ = "brand_voice"

    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(50), unique=True, nullable=False)
    content = Column(Text, nullable=False)
    examples = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PostStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    CANCELLED = "cancelled"


class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    generation_id = Column(Integer, ForeignKey("generations.id"), nullable=True)
    channel = Column(String(50), nullable=False)
    content = Column(JSON, nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    timezone = Column(String(50), default="Europe/Moscow")
    status = Column(SQLEnum(PostStatus), default=PostStatus.DRAFT, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


class BrandVoiceExample(Base):
    __tablename__ = "brand_voice_examples"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    channel = Column(String(50), nullable=False)
    original_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class ImageSettings(Base):
    __tablename__ = "image_settings"

    id = Column(Integer, primary_key=True, index=True)
    api_key = Column(String(255), nullable=True)
    model = Column(String(100), default="google/gemini-3-pro-image-preview")
    enabled = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
