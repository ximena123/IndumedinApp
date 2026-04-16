export type EstadoPedidoEmpresa =
  | 'pendiente'
  | 'en_proceso'
  | 'terminado'
  | 'entregado';

export interface PedidoEmpresa {
  id: string;
  nombreEmpresa: string;
  responsable: string;
  telefonoResponsable: string;
  descripcion: string;
  fechaEntrega: string;
  fechaCreacion: Date;
  estado: EstadoPedidoEmpresa;
}
