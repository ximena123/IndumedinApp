export interface Pedido {
  id: string;
  clienteId: string;
  medidaId: string;
  descripcion: string;
  fechaCreacion: Date;
  fechaEntrega: String;
  estado: 'pendiente' | 'en_proceso' | 'terminado' | 'entregado';
  /** Precio base, sin descuentos. */
  precio?: number;
  /** Marca si el cliente es estudiante de la UTPL (6% de descuento). */
  esEstudianteUtpl?: boolean;
  /** Monto descontado sobre el precio base. */
  descuento?: number;
  /** Total a pagar (`precio` - `descuento`). */
  total?: number;
  abono?: number;
  saldo?: number;
  notas?: string;
  cantidadTernos?: number;
  pedidoEmpresaId?: string;
  bordadoActivo?: boolean;
  bordadoNombre?: string;
  bordadoProfesion?: string;
  bordadoLogos?: string;
  bordadoPersonalizado?: string;
}
