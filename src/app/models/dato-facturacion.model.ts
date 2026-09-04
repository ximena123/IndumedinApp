/**
 * Contacto de facturación reutilizable.
 * Se guarda cuando se crea una factura con "otros datos" (distintos a los del
 * cliente registrado) para poder buscarlo y reutilizarlo en facturas futuras.
 */
export interface DatoFacturacion {
  id: string;
  nombreCompleto: string;
  apellidos: string;
  direccion: string;
  correoElectronico: string;
  numeroCelular: string;
  cedula: string;
  ruc?: string;
  createdAt: Date;
}
