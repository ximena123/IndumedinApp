/**
 * Convierte a `Date` un valor que puede venir de Firestore como Timestamp.
 *
 * Firestore devuelve las fechas como Timestamp (con método `toDate()`), y el
 * pipe `| date` de Angular lanza un error con ese tipo, lo que rompe la
 * detección de cambios de toda la vista. Normalizar evita ese fallo.
 */
export function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  if (typeof value === 'object' && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const fecha = (value as { toDate: () => Date }).toDate();
    return isNaN(fecha.getTime()) ? undefined : fecha;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const fecha = new Date(value);
    return isNaN(fecha.getTime()) ? undefined : fecha;
  }
  return undefined;
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) {
      out[key] = obj[key];
    }
  }
  return out;
}
