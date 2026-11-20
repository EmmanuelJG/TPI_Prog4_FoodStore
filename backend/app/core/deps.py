from collections.abc import Callable
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario


def get_current_user(
    session: Annotated[Session, Depends(get_session)],
    access_token: Annotated[str | None, Cookie()] = None,
) -> Usuario:
    """Lee la cookie HttpOnly, valida firma y expiración y carga el usuario."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
    )
    if not access_token:
        raise unauthorized
    try:
        payload = decode_access_token(access_token)
    except JWTError:
        raise unauthorized from None

    username = payload.get("sub")
    if not isinstance(username, str):
        raise unauthorized

    user = session.exec(select(Usuario).where(Usuario.username == username)).first()
    if user is None:
        raise unauthorized
    return user


def get_current_active_user(
    user: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    if user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cuenta de usuario desactivada",
        )
    return user


def require_role(roles: list[str]) -> Callable[[Usuario], Usuario]:
    def checker(
        user: Annotated[Usuario, Depends(get_current_active_user)],
    ) -> Usuario:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permisos para esta operación",
            )
        return user

    return checker
