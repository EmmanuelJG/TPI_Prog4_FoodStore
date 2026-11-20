from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import require_role
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import (
    CategoriaNoEncontrada,
    ProductoNoEncontrado,
    ProductoService,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/productos", tags=["productos"])

AdminUser = Annotated[Usuario, Depends(require_role(["admin"]))]


def get_producto_service() -> ProductoService:
    return ProductoService(ProductoUnitOfWork())


ServiceDep = Annotated[ProductoService, Depends(get_producto_service)]


def _producto_no_encontrado() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado"
    )


def _categoria_no_encontrada() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="La categoría no existe o está dada de baja",
    )


@router.get("", response_model=ProductosPaginados)
def listar_productos(
    service: ServiceDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    page: Annotated[int | None, Query(ge=1)] = None,
    size: Annotated[int | None, Query(ge=1, le=100)] = None,
    search: str | None = None,
    categoria_id: int | None = None,
    disponible: bool | None = None,
) -> ProductosPaginados:
    # page/size son una forma alternativa de pedir la misma página.
    if page is not None or size is not None:
        limit = size if size is not None else limit
        skip = ((page or 1) - 1) * limit
    return service.listar(
        skip=skip,
        limit=limit,
        search=search,
        categoria_id=categoria_id,
        disponible=disponible,
    )


@router.get("/{producto_id}", response_model=ProductoRead)
def obtener_producto(producto_id: int, service: ServiceDep) -> ProductoRead:
    try:
        return service.obtener(producto_id)
    except ProductoNoEncontrado:
        raise _producto_no_encontrado() from None


@router.post("", response_model=ProductoRead, status_code=status.HTTP_201_CREATED)
def crear_producto(
    data: ProductoCreate, _: AdminUser, service: ServiceDep
) -> ProductoRead:
    try:
        return service.crear(data)
    except CategoriaNoEncontrada:
        raise _categoria_no_encontrada() from None


@router.put("/{producto_id}", response_model=ProductoRead)
def actualizar_producto(
    producto_id: int, data: ProductoUpdate, _: AdminUser, service: ServiceDep
) -> ProductoRead:
    try:
        return service.actualizar(producto_id, data)
    except ProductoNoEncontrado:
        raise _producto_no_encontrado() from None
    except CategoriaNoEncontrada:
        raise _categoria_no_encontrada() from None


@router.patch("/{producto_id}/stock", response_model=ProductoRead)
def actualizar_stock(
    producto_id: int, data: ProductoStockUpdate, _: AdminUser, service: ServiceDep
) -> ProductoRead:
    try:
        return service.actualizar_stock(producto_id, data)
    except ProductoNoEncontrado:
        raise _producto_no_encontrado() from None


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(producto_id: int, _: AdminUser, service: ServiceDep) -> None:
    try:
        service.eliminar(producto_id)
    except ProductoNoEncontrado:
        raise _producto_no_encontrado() from None
