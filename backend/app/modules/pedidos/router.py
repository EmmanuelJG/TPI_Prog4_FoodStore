from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_active_user, require_role
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ProductoNoEncontrado,
    ReglaDeNegocio,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/pedidos", tags=["pedidos"])

SessionUser = Annotated[Usuario, Depends(get_current_active_user)]
AdminUser = Annotated[Usuario, Depends(require_role(["admin"]))]


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())


ServiceDep = Annotated[PedidoService, Depends(get_pedido_service)]


def _uid(user: Usuario) -> int:
    assert user.id is not None
    return user.id


def _http_error(exc: Exception) -> HTTPException:
    """Traduce las excepciones de dominio del Service a HTTPException."""
    if isinstance(exc, PedidoNoEncontrado):
        return HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado")
    if isinstance(exc, ProductoNoEncontrado):
        return HTTPException(
            status.HTTP_404_NOT_FOUND, "El producto no existe o está inactivo"
        )
    if isinstance(exc, PedidoAjeno):
        return HTTPException(
            status.HTTP_403_FORBIDDEN, "El pedido pertenece a otro usuario"
        )
    if isinstance(exc, ReglaDeNegocio):
        return HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
    raise exc


_DOMINIO = (PedidoNoEncontrado, ProductoNoEncontrado, PedidoAjeno, ReglaDeNegocio)


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def crear_pedido(data: PedidoCreate, user: SessionUser, service: ServiceDep) -> PedidoRead:
    try:
        return service.crear(_uid(user), data)
    except _DOMINIO as exc:
        raise _http_error(exc) from None


@router.get("", response_model=PedidosPaginados)
def listar_pedidos(
    user: SessionUser,
    service: ServiceDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: EstadoPedido | None = None,
) -> PedidosPaginados:
    return service.listar(
        usuario_id=_uid(user),
        es_admin=user.role == "admin",
        estado=estado,
        skip=skip,
        limit=limit,
    )


# Se declara antes de /{pedido_id} para que "resumen" no se interprete como un id.
@router.get("/resumen", response_model=ResumenPedidos)
def resumen_pedidos(_: AdminUser, service: ServiceDep) -> ResumenPedidos:
    return service.resumen()


@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener_pedido(pedido_id: int, user: SessionUser, service: ServiceDep) -> PedidoRead:
    try:
        return service.obtener(
            pedido_id, usuario_id=_uid(user), es_admin=user.role == "admin"
        )
    except _DOMINIO as exc:
        raise _http_error(exc) from None


@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
def cambiar_estado_pedido(
    pedido_id: int, data: CambioEstado, _: AdminUser, service: ServiceDep
) -> PedidoRead:
    try:
        return service.cambiar_estado(pedido_id, data.estado)
    except _DOMINIO as exc:
        raise _http_error(exc) from None


@router.patch("/{pedido_id}/cancelar", response_model=PedidoRead)
def cancelar_pedido(pedido_id: int, user: SessionUser, service: ServiceDep) -> PedidoRead:
    try:
        return service.cancelar(pedido_id, usuario_id=_uid(user))
    except _DOMINIO as exc:
        raise _http_error(exc) from None
