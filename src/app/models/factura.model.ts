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
  /** Vacío en las facturas creadas sin un pedido registrado. */
  pedidoId?: string;
  /** Vacío cuando la factura no está asociada a un cliente registrado. */
  clienteId?: string;
  /** `true` en las facturas creadas manualmente, sin pedido asociado. */
  sinPedido?: boolean;
  // Opcional: hay documentos antiguos/incompletos sin este objeto.
  datosCliente?: DatosCliente;
  detallePedido: string;
  valorTotal: number;
  fechaCreacion: Date;
  estado: 'pendiente' | 'procesada' | 'cancelada';
  observaciones?: string;
}
