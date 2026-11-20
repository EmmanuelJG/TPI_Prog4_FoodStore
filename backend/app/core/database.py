from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

_connect_args = (
    {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(settings.DATABASE_URL, connect_args=_connect_args)


def _import_models() -> None:
    """Importa todos los modelos para que SQLModel conozca las 5 tablas."""
    from app.modules.categorias import models as _c  # noqa: F401
    from app.modules.pedidos import models as _pe  # noqa: F401
    from app.modules.productos import models as _pr  # noqa: F401
    from app.modules.usuarios import models as _u  # noqa: F401


def create_all_tables() -> None:
    _import_models()
    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    return Session(engine)


def get_session() -> Iterator[Session]:
    """Sesión de solo lectura para las dependencias de autenticación."""
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
