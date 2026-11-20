from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioService:
    """En auth y usuarios se admite lanzar HTTPException desde el Service."""

    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def registrar(self, data: UserCreate) -> UserPublic:
        """Registro público: siempre crea usuarios con rol "user"."""
        with self.uow as uow:
            if (
                uow.usuarios.get_by_username(data.username) is not None
                or uow.usuarios.get_by_email(data.email) is not None
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El username o el email ya existen",
                )
            usuario = Usuario(
                username=data.username,
                full_name=data.full_name,
                email=data.email,
                hashed_password=hash_password(data.password),
                role="user",
            )
            uow.usuarios.add(usuario)
            return UserPublic.model_validate(usuario)

    def autenticar(self, username: str, password: str) -> UserPublic:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales incorrectas",
                )
            if usuario.disabled:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cuenta de usuario desactivada",
                )
            return UserPublic.model_validate(usuario)

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.get_all()]

    def activar(self, usuario_id: int) -> UserPublic:
        """Idempotente: responde 200 aunque el usuario ya estuviera activo."""
        return self._set_disabled(usuario_id, disabled=False)

    def desactivar(self, usuario_id: int, actor_id: int) -> UserPublic:
        """Idempotente. Un admin no puede desactivarse a sí mismo (400)."""
        if usuario_id == actor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No podés desactivarte a vos mismo",
            )
        return self._set_disabled(usuario_id, disabled=True)

    def _set_disabled(self, usuario_id: int, disabled: bool) -> UserPublic:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado",
                )
            usuario.disabled = disabled
            uow.usuarios.add(usuario)
            return UserPublic.model_validate(usuario)
