from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, Text, UniqueConstraint, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/exchange_rates")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    currency = Column(String(3), nullable=False)
    spot_buy = Column(Float, nullable=True)
    spot_sell = Column(Float, nullable=True)
    cash_buy = Column(Float, nullable=True)
    cash_sell = Column(Float, nullable=True)
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint("date", "currency", name="uq_date_currency"),
        Index("idx_currency_date", "currency", "date"),
    )


class DailyStat(Base):
    __tablename__ = "daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    currency = Column(String(3), unique=True, nullable=False)
    today_date = Column(Date, nullable=True)
    yesterday_rate = Column(Float, nullable=True)
    today_rate = Column(Float, nullable=True)
    change_pct = Column(Float, nullable=True)
    rank_gain = Column(Integer, nullable=True)
    rank_loss = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class ApiLog(Base):
    __tablename__ = "api_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    status = Column(String(20), nullable=True)
    message = Column(Text, nullable=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
