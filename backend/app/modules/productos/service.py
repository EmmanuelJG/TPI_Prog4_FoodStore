import math

from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork

__all__ = ["CategoriaNoEncontrada", "ProductoNoEncontrado", "ProductoService"]

# Campos opcionales que sí admiten null; el resto es obligatorio en la tabla.
_NULLABLES = {"descripcion", "imagen_url"}


class ProductoNoEncontrado(Exception):
    """El producto no existe o está dado de baja (se trata como inexistente)."""


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    def listar(
        self,
        *,
        skip: int,
        limit: int,
        search: str | None,
        categoria_id: int | None,
        disponible: bool | None,
    ) -> ProductosPaginados:
        with self.uow as uow:
            total, productos = uow.productos.search(
                nombre=search,
                categoria_id=categoria_id,
                disponible=disponible,
                skip=skip,
                limit=limit,
            )
            return ProductosPaginados(
                total=total,
                items=[ProductoRead.model_validate(p) for p in productos],
                page=skip // limit + 1,
                size=limit,
                pages=math.ceil(total / limit) if total else 0,
            )

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return ProductoRead.model_validate(self._get_activo(uow, producto_id))

    def crear(self, data: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            self._exigir_categoria_activa(uow, data.categoria_id)
            producto = Producto(**data.model_dump())
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, data: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._get_activo(uow, producto_id)
            cambios = data.model_dump(exclude_unset=True)

            nueva_categoria = cambios.get("categoria_id")
            if nueva_categoria is not None:
                self._exigir_categoria_activa(uow, nueva_categoria)

            for campo, valor in cambios.items():
                if valor is None and campo not in _NULLABLES:
                    continue
                setattr(producto, campo, valor)

            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar_stock(
        self, producto_id: int, data: ProductoStockUpdate
    ) -> ProductoRead:
        with self.uow as uow:
            producto = self._get_activo(uow, producto_id)
            if data.stock is not None:
                producto.stock = data.stock
            if data.disponible is not None:
                producto.disponible = data.disponible
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def eliminar(self, producto_id: int) -> None:
        """Baja lógica: activo = false."""
        with self.uow as uow:
            producto = self._get_activo(uow, producto_id)
            producto.activo = False
            uow.productos.add(producto)

    @staticmethod
    def _get_activo(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        producto = uow.productos.get_by_id(producto_id)
        if producto is None or not producto.activo:
            raise ProductoNoEncontrado(producto_id)
        return producto

    @staticmethod
    def _exigir_categoria_activa(uow: ProductoUnitOfWork, categoria_id: int) -> None:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada(categoria_id)
