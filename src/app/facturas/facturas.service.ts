import { Injectable, inject } from '@angular/core'
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, query, updateDoc, where } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Factura } from '../models/factura.model'
import { stripUndefined } from '../shared/firestore.util'

@Injectable({ providedIn: 'root' })
export class FacturasService {
  private firestore = inject(Firestore);
  private facturasRef = collection(this.firestore, 'facturas');

  getFacturas(): Observable<Factura[]> {
    return collectionData(this.facturasRef, { idField: 'id' }) as Observable<Factura[]>;
  }

  getFacturasByPedido(pedidoId: string): Observable<Factura[]> {
    const q = query(this.facturasRef, where('pedidoId', '==', pedidoId));
    return collectionData(q, { idField: 'id' }) as Observable<Factura[]>;
  }

  getFacturasByCliente(clienteId: string): Observable<Factura[]> {
    const q = query(this.facturasRef, where('clienteId', '==', clienteId));
    return collectionData(q, { idField: 'id' }) as Observable<Factura[]>;
  }

  getFacturasPendientes(): Observable<Factura[]> {
    const q = query(this.facturasRef, where('estado', '==', 'pendiente'));
    return collectionData(q, { idField: 'id' }) as Observable<Factura[]>;
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
