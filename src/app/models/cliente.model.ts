export interface Cliente {
  id: string;
  nombreCompleto: string;
  apellidos: string;
  telefono: string;
  profesion?: string;
  tallaCamisa?: string;
  tallaPantalon?: string;
  tallaMandil?: string;
  especificaciones?: string;
  createdAt: Date;
}
