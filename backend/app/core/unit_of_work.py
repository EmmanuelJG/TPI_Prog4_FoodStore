from collections.abc import Callable
from types import TracebackType
from typing import Self

from sqlmodel import Session

from app.core.database import session_factory as default_session_factory


class UnitOfWork:
    """Unit of Work base.

    Abre la sesión en __enter__ y hace commit, rollback y close en __exit__.
    Los Unit of Work de cada módulo heredan de esta clase y exponen sus
    repositorios sobre la misma sesión.
    """

    def __init__(
        self, session_factory: Callable[[], Session] = default_session_factory
    ) -> None:
        self._session_factory = session_factory
        self._session: Session | None = None

    @property
    def session(self) -> Session:
        if self._session is None:
            raise RuntimeError("El Unit of Work no está abierto")
        return self._session

    def __enter__(self) -> Self:
        self._session = self._session_factory()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        session = self.session
        try:
            if exc_type is None:
                session.commit()
            else:
                session.rollback()
        finally:
            session.close()
            self._session = None
