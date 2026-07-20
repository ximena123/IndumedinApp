export interface DatosCliente {
  usarDatosCliente: boolean;
  nombreCompleto?: string;
  apellidos?: string;
  direccion: string;
  correoElectronico: string;
  cedula?: string;
  ruc?: string;
  numeroCelular?: string;
}

export interface Factura {
  id: string;
  pedidoId: string;
  clienteId: string;
  datosCliente: DatosCliente;
  detallePedido: string;
  valorTotal: number;
  fechaCreacion: Date;
  estado: 'pendiente' | 'procesada' | 'cancelada';
  observaciones?: string;
}
