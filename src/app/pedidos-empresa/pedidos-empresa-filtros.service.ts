import { Injectable } from '@angular/core'

export interface PedidosEmpresaFiltrosState {
  busqueda: string;
  estadoTab: string;
}

@Injectable({ providedIn: 'root' })
export class PedidosEmpresaFiltrosService {
  private state: PedidosEmpresaFiltrosState = {
    busqueda: '',
    estadoTab: 'todos',
  };

  get(): PedidosEmpresaFiltrosState {
    return { ...this.state };
  }

  set(parcial: Partial<PedidosEmpresaFiltrosState>): void {
    this.state = { ...this.state, ...parcial };
  }

  reset(): void {
    this.state = { busqueda: '', estadoTab: 'todos' };
  }
}
