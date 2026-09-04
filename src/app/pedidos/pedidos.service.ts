import { Injectable, NgZone, inject } from '@angular/core'
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, query, updateDoc, where } from '@angular/fire/firestore'
import { Observable, map } from 'rxjs'
import { Pedido } from '../models/pedido.model'
import { stripUndefined, toDate } from '../shared/firestore.util'
import { runInZone } from '../shared/run-in-zone.operator'

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private firestore = inject(Firestore);
  private zone = inject(NgZone);
  private pedidosRef = collection(this.firestore, 'pedidos');

  /** Normaliza `fechaCreacion` (Timestamp de Firestore) a `Date` para que `| date` no falle. */
  private normalizar(pedidos: Pedido[]): Pedido[] {
    return pedidos.map((p) => ({ ...p, fechaCreacion: toDate(p.fechaCreacion) as Date }));
  }

  getPedidos(): Observable<Pedido[]> {
    return (collectionData(this.pedidosRef, { idField: 'id' }) as Observable<Pedido[]>).pipe(
      map((p) => this.normalizar(p)),
      runInZone(this.zone),
    );
  }

  getPedidosByCliente(clienteId: string): Observable<Pedido[]> {
    const q = query(this.pedidosRef, where('clienteId', '==', clienteId));
    return (collectionData(q, { idField: 'id' }) as Observable<Pedido[]>).pipe(
      map((p) => this.normalizar(p)),
      runInZone(this.zone),
    );
  }

  getPedidosByEmpresa(pedidoEmpresaId: string): Observable<Pedido[]> {
    const q = query(this.pedidosRef, where('pedidoEmpresaId', '==', pedidoEmpresaId));
    return (collectionData(q, { idField: 'id' }) as Observable<Pedido[]>).pipe(
      map((p) => this.normalizar(p)),
      runInZone(this.zone),
    );
  }

  getPedidosByFecha(fechaInicio: Date, fechaFin: Date): Observable<Pedido[]> {
    const q = query(
      this.pedidosRef,
      where('fechaCreacion', '>=', fechaInicio),
      where('fechaCreacion', '<=', fechaFin)
    );
    return (collectionData(q, { idField: 'id' }) as Observable<Pedido[]>).pipe(
      map((p) => this.normalizar(p)),
      runInZone(this.zone),
    );
  }

  addPedido(pedido: any): Promise<any> {
    const limpio = stripUndefined({ ...pedido, fechaCreacion: new Date() });
    return addDoc(this.pedidosRef, limpio);
  }

  updatePedido(id: string, pedido: Partial<Pedido>): Promise<void> {
    return updateDoc(doc(this.firestore, `pedidos/${id}`), stripUndefined(pedido));
  }

  deletePedido(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `pedidos/${id}`));
  }
}
