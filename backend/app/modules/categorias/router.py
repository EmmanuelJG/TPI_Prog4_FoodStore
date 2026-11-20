from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import require_role
from app.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaRead,
    CategoriaUpdate,
)
from app.modules.categorias.service import (
    CategoriaNoEncontrada,
    CategoriaService,
    NombreDuplicado,
)
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/categorias", tags=["categorias"])

AdminUser = Annotated[Usuario, Depends(require_role(["admin"]))]


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


ServiceDep = Annotated[CategoriaService, Depends(get_categoria_service)]

_NO_ENCONTRADA = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada"
)


def _nombre_duplicado() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Ya existe una categoría con ese nombre",
    )


@router.get("", response_model=list[CategoriaRead])
def listar_categorias(service: ServiceDep) -> list[CategoriaRead]:
    return service.listar()


@router.get("/{categoria_id}", response_model=CategoriaRead)
def obtener_categoria(categoria_id: int, service: ServiceDep) -> CategoriaRead:
    try:
        return service.obtener(categoria_id)
    except CategoriaNoEncontrada:
        raise _NO_ENCONTRADA from None


@router.post("", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def crear_categoria(
    data: CategoriaCreate, _: AdminUser, service: ServiceDep
) -> CategoriaRead:
    try:
        return service.crear(data)
    except NombreDuplicado:
        raise _nombre_duplicado() from None


@router.put("/{categoria_id}", response_model=CategoriaRead)
def actualizar_categoria(
    categoria_id: int, data: CategoriaUpdate, _: AdminUser, service: ServiceDep
) -> CategoriaRead:
    try:
        return service.actualizar(categoria_id, data)
    except CategoriaNoEncontrada:
        raise _NO_ENCONTRADA from None
    except NombreDuplicado:
        raise _nombre_duplicado() from None


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_categoria(categoria_id: int, _: AdminUser, service: ServiceDep) -> None:
    try:
        service.eliminar(categoria_id)
    except CategoriaNoEncontrada:
        raise _NO_ENCONTRADA from None
