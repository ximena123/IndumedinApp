import { Injectable, NgZone, inject } from '@angular/core'
import { Firestore, collection, collectionData, deleteDoc, doc, docData, updateDoc } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Cliente } from '../models/cliente.model'
import { stripUndefined } from '../shared/firestore.util'
import { runInZone } from '../shared/run-in-zone.operator'

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private firestore = inject(Firestore);
  private zone = inject(NgZone);
  private clientesRef = collection(this.firestore, 'clientes');

  getClientes(): Observable<Cliente[]> {
    return (collectionData(this.clientesRef, { idField: 'id' }) as Observable<Cliente[]>).pipe(runInZone(this.zone));
  }

  getCliente(id: string): Observable<Cliente> {
    return (docData(doc(this.firestore, `clientes/${id}`), { idField: 'id' }) as Observable<Cliente>).pipe(runInZone(this.zone));
  }

  addCliente(cliente: any): Promise<any> {
    const limpio = stripUndefined({ ...cliente, createdAt: new Date() });
    // @ts-ignore
    return import('@angular/fire/firestore').then(firestoreModule => {
      const addDoc = firestoreModule.addDoc;
      return addDoc(this.clientesRef, limpio);
    });
  }

  updateCliente(id: string, cliente: Partial<Cliente>): Promise<void> {
    return updateDoc(doc(this.firestore, `clientes/${id}`), stripUndefined(cliente));
  }

  deleteCliente(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `clientes/${id}`));
  }
}
