export interface Pedido {
  id: string;
  clienteId: string;
  medidaId: string;
  descripcion: string;
  fechaCreacion: Date;
  fechaEntrega: String;
  estado: 'pendiente' | 'en_proceso' | 'terminado' | 'entregado';
  precio?: number;
  abono?: number;
  saldo?: number;
  notas?: string;
  cantidadTernos?: number;
}
