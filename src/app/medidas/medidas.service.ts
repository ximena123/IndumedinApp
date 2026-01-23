import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, doc, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Medidas } from '../models/medidas.model';

@Injectable({ providedIn: 'root' })
export class MedidasService {
  private firestore = inject(Firestore);
  private medidasRef = collection(this.firestore, 'medidas');

  getMedidasByCliente(clienteId: string): Observable<Medidas[]> {
    const q = query(this.medidasRef, where('clienteId', '==', clienteId));
    return collectionData(q, { idField: 'id' }) as Observable<Medidas[]>;
  }

  addMedidas(medidas: Omit<Medidas, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    return addDoc(this.medidasRef, { ...medidas, createdAt: new Date(), updatedAt: new Date(), activo: true }).then(() => {});
  }

  updateMedidas(id: string, medidas: Partial<Medidas>): Promise<void> {
    return updateDoc(doc(this.firestore, `medidas/${id}`), { ...medidas, updatedAt: new Date() });
  }
}
