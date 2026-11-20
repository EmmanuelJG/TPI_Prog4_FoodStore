from datetime import datetime, timezone

from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado

__all__ = [
    "PedidoAjeno",
    "PedidoNoCancelable",
    "PedidoNoEncontrado",
    "PedidoService",
    "ProductoNoDisponible",
    "ProductoNoEncontrado",
    "ProductoRepetido",
    "ReglaDeNegocio",
    "StockInsuficiente",
    "TransicionInvalida",
]

PENDIENTE = "PENDIENTE"
EN_PREPARACION = "EN_PREPARACION"
ENTREGADO = "ENTREGADO"
CANCELADO = "CANCELADO"

# RN-02: mapa de transiciones válidas. Los estados terminales no admiten cambios.
TRANSICIONES: dict[str, set[str]] = {
    PENDIENTE: {EN_PREPARACION, CANCELADO},
    EN_PREPARACION: {ENTREGADO, CANCELADO},
    ENTREGADO: set(),
    CANCELADO: set(),
}


# --- Excepciones de dominio -------------------------------------------------


class PedidoNoEncontrado(Exception):
    """El pedido no existe."""


class PedidoAjeno(Exception):
    """El pedido pertenece a otro usuario (RN-04)."""


class ReglaDeNegocio(Exception):
    """Base de las reglas de negocio que el Router traduce a 400."""


class StockInsuficiente(ReglaDeNegocio):
    pass


class ProductoNoDisponible(ReglaDeNegocio):
    pass


class ProductoRepetido(ReglaDeNegocio):
    pass


class TransicionInvalida(ReglaDeNegocio):
    pass


class PedidoNoCancelable(ReglaDeNegocio):
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# --- Service ----------------------------------------------------------------


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    # RN-01
    def crear(self, usuario_id: int, data: PedidoCreate) -> PedidoRead:
        """Crea el pedido completo o no crea nada: una sola transacción.

        Si cualquier validación falla se lanza una excepción, el Unit of Work
        hace rollback y tampoco se persiste el descuento de stock.
        """
        ids = [item.producto_id for item in data.items]
        if len(ids) != len(set(ids)):
            raise ProductoRepetido("Hay productos repetidos entre los ítems")

        with self.uow as uow:
            pedido = uow.pedidos.add(
                Pedido(
                    usuario_id=usuario_id,
                    estado=PENDIENTE,
                    forma_pago=data.forma_pago,
                    direccion_entrega=data.direccion_entrega,
                    notas=data.notas,
                    total=0.0,
                )
            )

            total = 0.0
            for item in data.items:
                producto = uow.productos.get_by_id_for_update(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(item.producto_id)
                if not producto.disponible:
                    raise ProductoNoDisponible(
                        f"El producto «{producto.nombre}» no está disponible"
                    )
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente para «{producto.nombre}»: "
                        f"hay {producto.stock} y se pidieron {item.cantidad}"
                    )

                # Verificar, descontar y crear la línea en la misma iteración.
                producto.stock -= item.cantidad
                subtotal = round(producto.precio_base * item.cantidad, 2)
                uow.pedidos.add_detalle(
                    DetallePedido(
                        pedido_id=pedido.id,  # type: ignore[arg-type]
                        producto_id=item.producto_id,
                        cantidad=item.cantidad,
                        # RN-05: copia inmutable del nombre y del precio.
                        nombre_producto=producto.nombre,
                        precio_unitario=producto.precio_base,
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.pedidos.add(pedido)
            return PedidoRead.model_validate(pedido)

    # RN-04
    def listar(
        self,
        *,
        usuario_id: int,
        es_admin: bool,
        estado: str | None,
        skip: int,
        limit: int,
    ) -> PedidosPaginados:
        with self.uow as uow:
            if es_admin:
                total, pedidos = uow.pedidos.list_all(
                    estado=estado, skip=skip, limit=limit
                )
            else:
                total, pedidos = uow.pedidos.list_by_usuario(
                    usuario_id, estado=estado, skip=skip, limit=limit
                )
            return PedidosPaginados(
                total=total,
                items=[PedidoRead.model_validate(p) for p in pedidos],
            )

    def obtener(self, pedido_id: int, *, usuario_id: int, es_admin: bool) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get(uow, pedido_id)
            if not es_admin and pedido.usuario_id != usuario_id:
                raise PedidoAjeno(pedido_id)
            return PedidoRead.model_validate(pedido)

    # RN-02 y RN-03 (admin)
    def cambiar_estado(self, pedido_id: int, nuevo_estado: str) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get(uow, pedido_id)
            self._validar_transicion(pedido.estado, nuevo_estado)
            if nuevo_estado == CANCELADO:
                self._restituir_stock(uow, pedido)
            pedido.estado = nuevo_estado
            pedido.updated_at = _utcnow()
            uow.pedidos.add(pedido)
            return PedidoRead.model_validate(pedido)

    # RN-03 y RN-04 (dueño)
    def cancelar(self, pedido_id: int, *, usuario_id: int) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get(uow, pedido_id)
            if pedido.usuario_id != usuario_id:
                raise PedidoAjeno(pedido_id)
            if pedido.estado != PENDIENTE:
                raise PedidoNoCancelable(
                    "Solo se pueden cancelar pedidos en estado PENDIENTE"
                )
            self._restituir_stock(uow, pedido)
            pedido.estado = CANCELADO
            pedido.updated_at = _utcnow()
            uow.pedidos.add(pedido)
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            por_estado = uow.pedidos.count_by_estado()
            # "Hoy" = día calendario en UTC (las fechas se guardan en UTC).
            inicio_hoy = _utcnow().replace(
                hour=0, minute=0, second=0, microsecond=0, tzinfo=None
            )
            return ResumenPedidos(
                pendientes=por_estado.get(PENDIENTE, 0),
                en_preparacion=por_estado.get(EN_PREPARACION, 0),
                entregados=por_estado.get(ENTREGADO, 0),
                cancelados=por_estado.get(CANCELADO, 0),
                pedidos_hoy=uow.pedidos.count_desde(inicio_hoy),
                ingresos_entregados=uow.pedidos.sum_total_por_estado(ENTREGADO),
            )

    # --- helpers ---

    @staticmethod
    def _get(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(pedido_id)
        return pedido

    @staticmethod
    def _validar_transicion(actual: str, nuevo: str) -> None:
        if nuevo not in TRANSICIONES.get(actual, set()):
            raise TransicionInvalida(f"No se puede pasar de {actual} a {nuevo}")

    @staticmethod
    def _restituir_stock(uow: PedidoUnitOfWork, pedido: Pedido) -> None:
        """RN-03: devuelve el stock de cada línea en la misma transacción."""
        for detalle in pedido.items:
            producto = uow.productos.get_by_id_for_update(detalle.producto_id)
            if producto is not None:
                producto.stock += detalle.cantidad
