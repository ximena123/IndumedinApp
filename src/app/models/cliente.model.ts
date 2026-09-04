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
  // Datos de facturación reutilizables (se guardan al crear una factura con los datos del cliente)
  direccion?: string;
  correoElectronico?: string;
  cedula?: string;
  createdAt: Date;
}
