from app.core.security import create_access_token
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class AuthService:
    """Registro y login. Usa el modelo Usuario a través del módulo usuarios."""

    def __init__(self) -> None:
        self._usuarios = UsuarioService(UsuarioUnitOfWork())

    def register(self, data: UserCreate) -> UserPublic:
        return self._usuarios.registrar(data)

    def login(self, username: str, password: str) -> str:
        """Valida credenciales y devuelve el JWT (que viaja solo en la cookie)."""
        usuario = self._usuarios.autenticar(username, password)
        return create_access_token(subject=usuario.username)
