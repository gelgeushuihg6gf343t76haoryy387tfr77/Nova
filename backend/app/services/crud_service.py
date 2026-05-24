import uuid

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session


def list_entities(db: Session, stmt: Select):
    return list(db.scalars(stmt).all())


def create_entity(db: Session, model_cls, values: dict):
    entity = model_cls(**values)
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


def get_owned_entity(db: Session, model_cls, entity_id: uuid.UUID, business_id: uuid.UUID):
    entity = db.scalar(select(model_cls).where(model_cls.id == entity_id, model_cls.business_id == business_id))
    if not entity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{model_cls.__name__} not found")
    return entity


def update_entity(db: Session, entity, values: dict):
    for key, value in values.items():
        setattr(entity, key, value)
    db.commit()
    db.refresh(entity)
    return entity


def delete_entity(db: Session, entity):
    db.delete(entity)
    db.commit()
    return {"message": "Deleted successfully"}
