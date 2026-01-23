import { Injectable, inject } from '@angular/core'
import { Firestore, addDoc, collection, collectionData, doc, query, updateDoc, where } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Pedido } from '../models/pedido.model'

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private firestore = inject(Firestore);
  private pedidosRef = collection(this.firestore, 'pedidos');

  getPedidos(): Observable<Pedido[]> {
    return collectionData(this.pedidosRef, { idField: 'id' }) as Observable<Pedido[]>;
  }

  getPedidosByCliente(clienteId: string): Observable<Pedido[]> {
    const q = query(this.pedidosRef, where('clienteId', '==', clienteId));
    return collectionData(q, { idField: 'id' }) as Observable<Pedido[]>;
  }

  getPedidosByFecha(fechaInicio: Date, fechaFin: Date): Observable<Pedido[]> {
    const q = query(
      this.pedidosRef,
      where('fechaCreacion', '>=', fechaInicio),
      where('fechaCreacion', '<=', fechaFin)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Pedido[]>;
  }

  addPedido(pedido: any): Promise<any> {
    return addDoc(this.pedidosRef, { ...pedido, fechaCreacion: new Date() });
  }

  updatePedido(id: string, pedido: Partial<Pedido>): Promise<void> {
    return updateDoc(doc(this.firestore, `pedidos/${id}`), pedido);
  }
}
