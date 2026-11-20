from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Pedido(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    estado: str = Field(default="PENDIENTE")
    forma_pago: str
    direccion_entrega: str
    notas: str | None = Field(default=None)
    total: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    usuario: "Usuario" = Relationship(back_populates="pedidos")
    items: list["DetallePedido"] = Relationship(
        back_populates="pedido",
        sa_relationship_kwargs={"order_by": "DetallePedido.id"},
    )


class DetallePedido(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    producto_id: int = Field(foreign_key="producto.id")
    cantidad: int
    # Copia inmutable de los datos del producto al momento de crear el pedido (RN-05)
    nombre_producto: str
    precio_unitario: float
    subtotal: float

    pedido: "Pedido" = Relationship(back_populates="items")
    producto: "Producto" = Relationship(back_populates="detalles")
