/** Porcentaje de descuento que se aplica a los pedidos de estudiantes de la UTPL. */
export const DESCUENTO_UTPL = 0.06;

/**
 * Redondea un valor monetario a 2 decimales hacia el inmediato superior.
 *
 * Antes de aplicar `Math.ceil` se limpia el ruido de la aritmética binaria
 * (`12.34 * 100` da `1234.0000000000002`), para que un valor que ya tiene 2
 * decimales exactos no suba un centavo de más.
 */
export function redondearArriba2(valor: number | null | undefined): number {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero)) return 0;
  const centavos = Math.round(numero * 100 * 1e6) / 1e6;
  return Math.ceil(centavos) / 100;
}

/** Formatea un valor monetario con 2 decimales, redondeando hacia arriba. */
export function formatMoneda(valor: number | null | undefined): string {
  return redondearArriba2(valor).toFixed(2);
}

/**
 * Total a pagar de un pedido: el total con descuento cuando existe y, si no
 * (pedidos antiguos anteriores al descuento UTPL), el precio.
 */
export function totalPedido(
  pedido: { precio?: number; total?: number } | null | undefined,
): number {
  if (!pedido) return 0;
  return pedido.total ?? pedido.precio ?? 0;
}

/**
 * Calcula el descuento y el total a pagar de un pedido.
 * El precio base se conserva siempre; el 6% solo se descuenta cuando el
 * cliente es estudiante de la UTPL.
 */
export function calcularTotales(
  precio: number | null | undefined,
  esEstudianteUtpl: boolean,
): { base: number; descuento: number; total: number } {
  const base = redondearArriba2(precio);
  if (!esEstudianteUtpl) {
    return { base, descuento: 0, total: base };
  }
  const total = redondearArriba2(base * (1 - DESCUENTO_UTPL));
  return { base, descuento: redondearArriba2(base - total), total };
}
