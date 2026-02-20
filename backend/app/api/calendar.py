from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.models import User, ScheduledPost, PostStatus
from app.schemas.schemas import (
    ScheduledPostCreate, ScheduledPostUpdate, ScheduledPostResponse, MessageResponse
)
from app.api.endpoints import get_current_user

router = APIRouter()


@router.get("/calendar", response_model=List[ScheduledPostResponse])
async def get_calendar(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(ScheduledPost).where(ScheduledPost.user_id == current_user.id)
    
    if start_date:
        query = query.where(ScheduledPost.scheduled_date >= start_date)
    if end_date:
        query = query.where(ScheduledPost.scheduled_date <= end_date)
    if status:
        try:
            post_status = PostStatus(status)
            query = query.where(ScheduledPost.status == post_status)
        except ValueError:
            pass
    
    query = query.order_by(ScheduledPost.scheduled_date)
    
    result = await db.execute(query)
    posts = result.scalars().all()
    
    return posts


@router.post("/calendar", response_model=ScheduledPostResponse)
async def create_scheduled_post(
    data: ScheduledPostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    post = ScheduledPost(
        user_id=current_user.id,
        generation_id=data.generation_id,
        channel=data.channel,
        content=data.content,
        scheduled_date=data.scheduled_date,
        timezone=data.timezone,
        status=PostStatus.SCHEDULED
    )
    
    db.add(post)
    await db.commit()
    await db.refresh(post)
    
    return post


@router.get("/calendar/{post_id}", response_model=ScheduledPostResponse)
async def get_scheduled_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ScheduledPost).where(
            and_(
                ScheduledPost.id == post_id,
                ScheduledPost.user_id == current_user.id
            )
        )
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled post not found"
        )
    
    return post


@router.put("/calendar/{post_id}", response_model=ScheduledPostResponse)
async def update_scheduled_post(
    post_id: int,
    data: ScheduledPostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ScheduledPost).where(
            and_(
                ScheduledPost.id == post_id,
                ScheduledPost.user_id == current_user.id
            )
        )
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled post not found"
        )
    
    if data.scheduled_date is not None:
        post.scheduled_date = data.scheduled_date
    if data.timezone is not None:
        post.timezone = data.timezone
    if data.status is not None:
        try:
            post.status = PostStatus(data.status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Valid values: draft, scheduled, published, cancelled"
            )
    
    await db.commit()
    await db.refresh(post)
    
    return post


@router.delete("/calendar/{post_id}", response_model=MessageResponse)
async def delete_scheduled_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ScheduledPost).where(
            and_(
                ScheduledPost.id == post_id,
                ScheduledPost.user_id == current_user.id
            )
        )
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled post not found"
        )
    
    await db.delete(post)
    await db.commit()
    
    return MessageResponse(message="Scheduled post deleted successfully")
