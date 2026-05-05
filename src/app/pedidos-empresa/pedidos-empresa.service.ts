import { Injectable, inject } from '@angular/core'
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  updateDoc,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { PedidoEmpresa } from '../models/pedido-empresa.model'
import { stripUndefined } from '../shared/firestore.util'

@Injectable({ providedIn: 'root' })
export class PedidosEmpresaService {
  private firestore = inject(Firestore);
  private pedidosEmpresaRef = collection(this.firestore, 'pedidos_empresa');

  getPedidosEmpresa(): Observable<PedidoEmpresa[]> {
    return collectionData(this.pedidosEmpresaRef, { idField: 'id' }) as Observable<PedidoEmpresa[]>;
  }

  getPedidoEmpresa(id: string): Observable<PedidoEmpresa> {
    return docData(doc(this.firestore, `pedidos_empresa/${id}`), { idField: 'id' }) as Observable<PedidoEmpresa>;
  }

  addPedidoEmpresa(pedidoEmpresa: Partial<PedidoEmpresa>): Promise<{ id: string }> {
    const limpio = stripUndefined({ ...pedidoEmpresa, fechaCreacion: new Date() });
    return addDoc(this.pedidosEmpresaRef, limpio)
      .then((ref) => ({ id: ref.id }));
  }

  updatePedidoEmpresa(id: string, pedidoEmpresa: Partial<PedidoEmpresa>): Promise<void> {
    return updateDoc(doc(this.firestore, `pedidos_empresa/${id}`), stripUndefined(pedidoEmpresa));
  }

  deletePedidoEmpresa(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `pedidos_empresa/${id}`));
  }
}
