import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { BehaviorSubject, Observable, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import { ClientesService } from '../clientes/clientes.service'
import { Pedido } from '../models/pedido.model'
import { ResumenComponent } from '../resumen/resumen.component'
import { PedidosService } from './pedidos.service'
@Component({
  standalone: true,
  selector: 'app-pedidos-list',
  imports: [CommonModule, FormsModule, ResumenComponent],
  template: `
    <div class="row">
      <div class="col-lg-8 col-md-12">
        <!-- CONTENIDO ORIGINAL DE PEDIDOS -->
        <div class="container mt-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Pedidos</h2>
            <button class="btn btn-primary" (click)="nuevoPedido()">
              Nuevo pedido
            </button>
          </div>
          <div class="mb-3 row">
            <div class="col-md-6">
              <input
                type="text"
                class="form-control"
                placeholder="Buscar cliente"
                [(ngModel)]="busquedaCliente"
                (input)="onClienteSearch(busquedaCliente)"
              />
            </div>
            <div class="col-md-3">
              <input
                type="date"
                class="form-control"
                [(ngModel)]="busquedaFecha"
                (change)="onFechaEntrega(busquedaFecha)"
              />
            </div>
            <div class="col-md-3">
              <button
                class="btn btn-outline-secondary"
                (click)="borrarFiltros()"
              >
                Borrar filtro
              </button>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-striped table-bordered align-middle">
              <thead class="table-dark">
                <tr>
                  <th class="text-center">Cliente</th>
                  <th class="text-center">Fecha de entrega</th>
                  <th class="text-center d-none d-md-table-cell">Estado</th>
                  <th class="text-center d-none d-md-table-cell">
                    Descripción
                  </th>
                  <th class="text-center d-none d-md-table-cell">Precio</th>
                  <th class="text-center d-none d-md-table-cell">Abono</th>
                  <th class="text-center d-none d-md-table-cell">Saldo</th>
                  <th class="text-center">Acciones</th>
                  <th class="text-center">Editar</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pedido of pedidosFiltrados$ | async">
                  <td>{{ getClienteNombre(pedido.clienteId) }}</td>
                  <td class="text-center">
                    {{ getFechaEntrega(pedido.fechaEntrega) }}
                  </td>
                  <td class="text-center d-none d-md-table-cell">
                    {{ pedido.estado }}
                  </td>
                  <td class="d-none d-md-table-cell" style="font-size: 12px">
                    {{
                      pedido.descripcion.length > 100
                        ? (pedido.descripcion | slice: 0 : 100) + '...'
                        : pedido.descripcion
                    }}
                  </td>
                  <td class="d-none d-md-table-cell">{{ pedido.precio }}</td>
                  <td class="d-none d-md-table-cell">{{ pedido.abono }}</td>
                  <td class="d-none d-md-table-cell">{{ pedido.saldo }}</td>
                  <td class="text-center">
                    <div
                      class="d-flex flex-column flex-md-row justify-content-center align-items-center gap-2"
                    >
                      <button
                        class="btn btn-warning btn-sm w-100 w-md-auto"
                        (click)="verDetalle(pedido.id)"
                      >
                        Ver más
                      </button>
                      <button
                        class="btn btn-success btn-sm w-100 w-md-auto"
                        [disabled]="pedido.estado === 'entregado'"
                        (click)="marcarComoEntregado(pedido)"
                      >
                        Marcar como Entregado
                      </button>
                    </div>
                  </td>
                  <td class="text-center">
                    <button
                      class="btn btn-info btn-sm w-100 w-md-auto"
                      (click)="editarPedido(pedido.id)"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <nav *ngIf="totalPages > 1">
          <ul class="pagination justify-content-center">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" (click)="setPage(page - 1)">
                &laquo;
              </button>
            </li>
            <li
              class="page-item"
              *ngFor="let p of [].constructor(totalPages); let i = index"
              [class.active]="page === i + 1"
            >
              <button class="page-link" (click)="setPage(i + 1)">
                {{ i + 1 }}
              </button>
            </li>
            <li class="page-item" [class.disabled]="page === totalPages">
              <button class="page-link" (click)="setPage(page + 1)">
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <div class="col-lg-4 d-none d-lg-block">
        <app-resumen></app-resumen>
      </div>
    </div>
  `,
})
export class PedidosListComponent {
  busquedaCliente = '';
  busquedaFecha = '';
  page = 1;
  pageSize = 10;
  totalPages = 1;
  private page$ = new BehaviorSubject<number>(1);
  private clienteSearch$ = new BehaviorSubject<string>('');
  private fechaEntrega$ = new BehaviorSubject<string>('');

  borrarFiltros() {
    this.busquedaCliente = '';
    this.busquedaFecha = '';
    this.onClienteSearch('');
    this.onFechaEntrega('');
  }

  nuevoPedido() {
    this.router.navigate(['/pedidos/nuevo']);
  }
  formatDateYMD(date: Date): string {
    // Devuelve yyyy-MM-dd
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  getFechaEntrega(fecha: any): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') return fecha;
    // Firestore Timestamp legacy (por si quedan viejos)
    if (
      fecha &&
      typeof fecha === 'object' &&
      typeof fecha.toDate === 'function'
    ) {
      const d = fecha.toDate();
      return this.formatDateYMD(d);
    }

    if (fecha instanceof Date) {
      return this.formatDateYMD(fecha);
    }
    return '';
  }
  getInputValue(event: Event): string {
    const target = event.target as HTMLInputElement;
    return target?.value ?? '';
  }
  pedidos$ = this.pedidosService.getPedidos();

  pedidosFiltrados$: Observable<Pedido[]> = combineLatest([
    this.pedidos$,
    this.clienteSearch$,
    this.fechaEntrega$,
    this.page$,
  ]).pipe(
    map(([pedidos, clienteSearch, fechaEntrega, page]) => {
      const filtrados = pedidos.filter((p) => {
        const nombreCoincide =
          !clienteSearch ||
          this.getClienteNombre(p.clienteId)
            .toLowerCase()
            .includes(clienteSearch.toLowerCase());
        if (!fechaEntrega) return nombreCoincide;
        // Convertir fechaEntrega del pedido a string yyyy-MM-dd para comparar
        let pedidoFechaStr = '';
        const fechaEntregaObj = p.fechaEntrega;
        if (
          fechaEntregaObj &&
          typeof fechaEntregaObj === 'object' &&
          typeof (fechaEntregaObj as any).toDate === 'function'
        ) {
          // Firestore Timestamp legacy
          pedidoFechaStr = this.formatDateYMD(
            (fechaEntregaObj as any).toDate(),
          );
        } else if (fechaEntregaObj instanceof Date) {
          pedidoFechaStr = this.formatDateYMD(fechaEntregaObj);
        } else if (typeof fechaEntregaObj === 'string') {
          pedidoFechaStr =
            fechaEntregaObj.length >= 10
              ? fechaEntregaObj.substring(0, 10)
              : fechaEntregaObj;
        }
        // El input type="date" siempre da yyyy-MM-dd
        return nombreCoincide && pedidoFechaStr === fechaEntrega;
      });

      this.totalPages = Math.max(1, Math.ceil(filtrados.length / this.pageSize));
      const paginaValida = Math.min(Math.max(page, 1), this.totalPages);
      if (paginaValida !== this.page) this.page = paginaValida;
      if (paginaValida !== page) this.page$.next(paginaValida);

      const start = (paginaValida - 1) * this.pageSize;
      return filtrados.slice(start, start + this.pageSize);
    }),
  );
  clientesMap: Record<string, string> = {};

  constructor(
    private pedidosService: PedidosService,
    private clientesService: ClientesService,
    private router: Router,
  ) {
    this.clientesService.getClientes().subscribe((clientes) => {
      this.clientesMap = {};
      clientes.forEach((c) => {
        this.clientesMap[c.id] = `${c.nombreCompleto} ${c.apellidos}`;
      });
    });
  }

  getClienteNombre(id: string): string {
    return this.clientesMap[id] || id;
  }

  verDetalle(id: string) {
    this.router.navigate(['/pedidos', id]);
  }

  onClienteSearch(value: string) {
    this.page = 1;
    this.page$.next(1);
    this.clienteSearch$.next(value);
  }
  onFechaEntrega(value: string) {
    this.page = 1;
    this.page$.next(1);
    this.fechaEntrega$.next(value);
  }

  editarPedido(id: string) {
    this.router.navigate(['/pedidos/editar', id]);
  }

  marcarComoEntregado(pedido: Pedido) {
    if (pedido.estado !== 'entregado') {
      this.pedidosService.updatePedido(pedido.id, { estado: 'entregado' });
    }
  }
  setPage(page: number) {
    const paginaValida = Math.min(Math.max(page, 1), this.totalPages || 1);
    this.page = paginaValida;
    this.page$.next(paginaValida);
  }
}

