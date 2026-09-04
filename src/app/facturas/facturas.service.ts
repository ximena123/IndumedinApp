import { Injectable, NgZone, inject } from '@angular/core'
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, query, updateDoc, where } from '@angular/fire/firestore'
import { Observable, map } from 'rxjs'
import { Factura } from '../models/factura.model'
import { stripUndefined, toDate } from '../shared/firestore.util'
import { runInZone } from '../shared/run-in-zone.operator'

@Injectable({ providedIn: 'root' })
export class FacturasService {
  private firestore = inject(Firestore);
  private zone = inject(NgZone);
  private facturasRef = collection(this.firestore, 'facturas');

  /** Normaliza las fechas de Firestore (Timestamp) a `Date` para que `| date` no falle. */
  private normalizar(facturas: Factura[]): Factura[] {
    return facturas.map((f) => ({ ...f, fechaCreacion: toDate(f.fechaCreacion) as Date }));
  }

  getFacturas(): Observable<Factura[]> {
    return (collectionData(this.facturasRef, { idField: 'id' }) as Observable<Factura[]>).pipe(
      map((f) => this.normalizar(f)),
      runInZone(this.zone),
    );
  }

  getFacturasByPedido(pedidoId: string): Observable<Factura[]> {
    const q = query(this.facturasRef, where('pedidoId', '==', pedidoId));
    return (collectionData(q, { idField: 'id' }) as Observable<Factura[]>).pipe(
      map((f) => this.normalizar(f)),
      runInZone(this.zone),
    );
  }

  getFacturasByCliente(clienteId: string): Observable<Factura[]> {
    const q = query(this.facturasRef, where('clienteId', '==', clienteId));
    return (collectionData(q, { idField: 'id' }) as Observable<Factura[]>).pipe(
      map((f) => this.normalizar(f)),
      runInZone(this.zone),
    );
  }

  getFacturasPendientes(): Observable<Factura[]> {
    const q = query(this.facturasRef, where('estado', '==', 'pendiente'));
    return (collectionData(q, { idField: 'id' }) as Observable<Factura[]>).pipe(
      map((f) => this.normalizar(f)),
      runInZone(this.zone),
    );
  }

  addFactura(factura: any): Promise<any> {
    const limpio = stripUndefined({ ...factura, fechaCreacion: new Date() });
    return addDoc(this.facturasRef, limpio);
  }

  updateFactura(id: string, factura: Partial<Factura>): Promise<void> {
    return updateDoc(doc(this.firestore, `facturas/${id}`), stripUndefined(factura));
  }

  deleteFactura(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `facturas/${id}`));
  }
}
