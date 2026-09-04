import { NgZone } from '@angular/core'
import { Observable } from 'rxjs'

/**
 * Reingresa a la zona de Angular en cada emisión del observable fuente.
 *
 * Firestore (AngularFire) a veces emite fuera de NgZone, lo que impide que la
 * detección de cambios repinte la vista: los datos llegan pero la tabla se ve
 * en blanco hasta que ocurre otro evento (un clic). Este operador garantiza que
 * cada emisión ocurra dentro de la zona, disparando la detección de cambios.
 */
export function runInZone<T>(zone: NgZone) {
  return (source: Observable<T>): Observable<T> =>
    new Observable<T>((observer) =>
      source.subscribe({
        next: (value) => zone.run(() => observer.next(value)),
        error: (err) => zone.run(() => observer.error(err)),
        complete: () => zone.run(() => observer.complete()),
      }),
    )
}
