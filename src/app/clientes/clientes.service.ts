import { Injectable, inject } from '@angular/core'
import { Firestore, collection, collectionData, deleteDoc, doc, docData, updateDoc } from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Cliente } from '../models/cliente.model'
import { stripUndefined } from '../shared/firestore.util'

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private firestore = inject(Firestore);
  private clientesRef = collection(this.firestore, 'clientes');

  getClientes(): Observable<Cliente[]> {
    return collectionData(this.clientesRef, { idField: 'id' }) as Observable<Cliente[]>;
  }

  getCliente(id: string): Observable<Cliente> {
    return docData(doc(this.firestore, `clientes/${id}`), { idField: 'id' }) as Observable<Cliente>;
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
