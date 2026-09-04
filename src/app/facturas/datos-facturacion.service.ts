import { Injectable, NgZone, inject } from '@angular/core'
import { Firestore, addDoc, collection, collectionData, getDocs, query, updateDoc, where } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { DatoFacturacion } from '../models/dato-facturacion.model'
import { stripUndefined } from '../shared/firestore.util'
import { runInZone } from '../shared/run-in-zone.operator'

@Injectable({ providedIn: 'root' })
export class DatosFacturacionService {
  private firestore = inject(Firestore);
  private zone = inject(NgZone);
  private ref = collection(this.firestore, 'datosFacturacion');

  getDatosFacturacion(): Observable<DatoFacturacion[]> {
    return (collectionData(this.ref, { idField: 'id' }) as Observable<DatoFacturacion[]>).pipe(
      runInZone(this.zone),
    );
  }

  /**
   * Guarda un contacto de facturación. Si ya existe uno con la misma cédula,
   * lo actualiza en lugar de duplicarlo.
   */
  async guardarDato(dato: Omit<DatoFacturacion, 'id' | 'createdAt'>): Promise<void> {
    const cedula = (dato.cedula || '').trim();
    if (cedula) {
      const existentes = await getDocs(query(this.ref, where('cedula', '==', cedula)));
      if (!existentes.empty) {
        await updateDoc(existentes.docs[0].ref, stripUndefined({ ...dato }));
        return;
      }
    }
    await addDoc(this.ref, stripUndefined({ ...dato, createdAt: new Date() }));
  }
}
