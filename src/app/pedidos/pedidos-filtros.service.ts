import { Injectable } from '@angular/core'

export interface PedidosFiltrosState {
  busquedaCliente: string;
  busquedaFecha: string;
  estadoTab: string;
  page: number;
}

@Injectable({ providedIn: 'root' })
export class PedidosFiltrosService {
  private state: PedidosFiltrosState = {
    busquedaCliente: '',
    busquedaFecha: '',
    estadoTab: 'todos',
    page: 1,
  };

  get(): PedidosFiltrosState {
    return { ...this.state };
  }

  set(parcial: Partial<PedidosFiltrosState>): void {
    this.state = { ...this.state, ...parcial };
  }

  reset(): void {
    this.state = {
      busquedaCliente: '',
      busquedaFecha: '',
      estadoTab: 'todos',
      page: 1,
    };
  }
}
