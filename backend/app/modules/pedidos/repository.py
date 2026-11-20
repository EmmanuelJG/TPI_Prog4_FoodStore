from datetime import datetime

from sqlmodel import Session, func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def add_detalle(self, detalle: DetallePedido) -> DetallePedido:
        self.session.add(detalle)
        self.session.flush()
        return detalle

    def list_by_usuario(
        self,
        usuario_id: int,
        *,
        estado: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[int, list[Pedido]]:
        return self._listar(Pedido.usuario_id == usuario_id, estado, skip, limit)

    def list_all(
        self, *, estado: str | None = None, skip: int = 0, limit: int = 20
    ) -> tuple[int, list[Pedido]]:
        return self._listar(None, estado, skip, limit)

    def count_by_estado(self) -> dict[str, int]:
        filas = self.session.exec(
            select(Pedido.estado, func.count()).group_by(Pedido.estado)
        ).all()
        return {estado: cantidad for estado, cantidad in filas}

    def count_desde(self, desde: datetime) -> int:
        return self.session.exec(
            select(func.count()).select_from(Pedido).where(Pedido.created_at >= desde)
        ).one()

    def sum_total_por_estado(self, estado: str) -> float:
        total = self.session.exec(
            select(func.coalesce(func.sum(Pedido.total), 0.0)).where(
                Pedido.estado == estado
            )
        ).one()
        return float(total)

    def _listar(
        self, base, estado: str | None, skip: int, limit: int
    ) -> tuple[int, list[Pedido]]:
        condiciones = []
        if base is not None:
            condiciones.append(base)
        if estado is not None:
            condiciones.append(Pedido.estado == estado)

        consulta_total = select(func.count()).select_from(Pedido)
        consulta_items = select(Pedido)
        for condicion in condiciones:
            consulta_total = consulta_total.where(condicion)
            consulta_items = consulta_items.where(condicion)

        total = self.session.exec(consulta_total).one()
        items = self.session.exec(
            consulta_items.order_by(Pedido.created_at.desc(), Pedido.id.desc())
            .offset(skip)
            .limit(limit)
        ).all()
        return total, list(items)
