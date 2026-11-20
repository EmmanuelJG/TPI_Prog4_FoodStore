"""Carga inicial: usuario admin, categorías y productos con stock.

Es idempotente: se puede ejecutar varias veces sin duplicar datos.

    python -m app.db.seed
"""

from sqlmodel import Session, select

from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

ADMIN = {
    "username": "admin",
    "full_name": "Administrador",
    "email": "admin@foodstore.com",
    "password": "Admin1234!",
}

CATEGORIAS: list[tuple[str, str]] = [
    ("Pizzas", "Pizzas al horno de piedra"),
    ("Hamburguesas", "Hamburguesas de carne y vegetarianas"),
    ("Bebidas", "Gaseosas, jugos y agua"),
    ("Postres", "Dulces para cerrar la comida"),
]

# (categoría, nombre, descripción, precio_base, stock)
PRODUCTOS: list[tuple[str, str, str, float, int]] = [
    ("Pizzas", "Muzzarella", "Salsa de tomate, muzzarella y aceitunas", 9500.0, 20),
    ("Pizzas", "Napolitana", "Muzzarella, rodajas de tomate, ajo y orégano", 11000.0, 15),
    ("Pizzas", "Fugazzeta", "Muzzarella y cebolla caramelizada", 11500.0, 12),
    ("Hamburguesas", "Clásica", "Carne, lechuga, tomate y queso cheddar", 8500.0, 25),
    ("Hamburguesas", "Doble Cheddar", "Doble carne, doble cheddar y panceta", 10500.0, 18),
    ("Bebidas", "Gaseosa cola 500ml", "Botella individual bien fría", 2500.0, 50),
    ("Bebidas", "Agua mineral 500ml", "Sin gas", 1800.0, 60),
    ("Postres", "Flan casero", "Con dulce de leche y crema", 4200.0, 10),
]


def _seed_admin(session: Session) -> None:
    existente = session.exec(
        select(Usuario).where(Usuario.username == ADMIN["username"])
    ).first()
    if existente is not None:
        return
    session.add(
        Usuario(
            username=ADMIN["username"],
            full_name=ADMIN["full_name"],
            email=ADMIN["email"],
            hashed_password=hash_password(ADMIN["password"]),
            role="admin",
        )
    )


def _seed_categorias(session: Session) -> dict[str, Categoria]:
    por_nombre: dict[str, Categoria] = {}
    for nombre, descripcion in CATEGORIAS:
        categoria = session.exec(
            select(Categoria).where(Categoria.nombre == nombre)
        ).first()
        if categoria is None:
            categoria = Categoria(nombre=nombre, descripcion=descripcion)
            session.add(categoria)
            session.flush()
        por_nombre[nombre] = categoria
    return por_nombre


def _seed_productos(session: Session, categorias: dict[str, Categoria]) -> None:
    for cat_nombre, nombre, descripcion, precio, stock in PRODUCTOS:
        categoria = categorias[cat_nombre]
        existente = session.exec(
            select(Producto).where(
                Producto.nombre == nombre, Producto.categoria_id == categoria.id
            )
        ).first()
        if existente is None:
            session.add(
                Producto(
                    categoria_id=categoria.id,  # type: ignore[arg-type]
                    nombre=nombre,
                    descripcion=descripcion,
                    precio_base=precio,
                    stock=stock,
                )
            )


def run() -> None:
    create_all_tables()
    with session_factory() as session:
        _seed_admin(session)
        categorias = _seed_categorias(session)
        _seed_productos(session, categorias)
        session.commit()
    print(
        f"Seed listo: usuario '{ADMIN['username']}' / '{ADMIN['password']}', "
        f"{len(CATEGORIAS)} categorías y {len(PRODUCTOS)} productos."
    )


if __name__ == "__main__":
    run()
