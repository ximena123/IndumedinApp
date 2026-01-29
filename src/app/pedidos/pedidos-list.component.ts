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
    <style>
      @media (max-width: 600px) {
        .pedidos-filtros input[type="date"] {
          font-size: 14px;
          min-width: 100px;
          width: 100%;
        }
        .pedidos-filtros input[type="date"]::-webkit-input-placeholder {
          color: #888;
          opacity: 1;
        }
        .pedidos-filtros input[type="date"]::placeholder {
          color: #888;
          opacity: 1;
        }
      }
    </style>
    <div class="row">
      <div class="col-lg-8 col-md-12">
        <!-- TABS DE ESTADO DE PEDIDOS -->
        <div class="container mt-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Pedidos</h2>
            <button class="btn btn-primary" (click)="nuevoPedido()">
              Nuevo pedido
            </button>
          </div>
          <ul class="nav nav-tabs mb-3">
            <li class="nav-item">
              <a class="nav-link" [class.active]="estadoTab === 'todos'" (click)="setEstadoTab('todos')">Todos</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="estadoTab === 'pendiente'" (click)="setEstadoTab('pendiente')">Pendiente</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="estadoTab === 'en_proceso'" (click)="setEstadoTab('en_proceso')">En proceso</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="estadoTab === 'entregado'" (click)="setEstadoTab('entregado')">Entregado</a>
            </li>
          </ul>
          <div class="mb-3 row">
            <div class="col-md-6 pedidos-filtros">
              <input
                type="text"
                class="form-control"
                placeholder="Buscar cliente"
                [(ngModel)]="busquedaCliente"
                (input)="onClienteSearch(busquedaCliente)"
              />
            </div>
            <div class="col-md-3 pedidos-filtros">
              <input
                type="date"
                class="form-control"
                placeholder="Filtrar por fecha"
                [(ngModel)]="busquedaFecha"
                (change)="onFechaEntrega(busquedaFecha)"
              />
            </div>
            <div class="col-md-3 pedidos-filtros">
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
                  <th class="text-center">Estado</th>
                  <th class="text-center d-none d-md-table-cell">
                    Descripción
                  </th>
                  <th class="text-center d-none d-md-table-cell">Precio</th>
                  <th class="text-center d-none d-md-table-cell">Abono</th>
                  <th class="text-center d-none d-md-table-cell">Saldo</th>
                  <th class="text-center">Acciones</th>
                  <th class="text-center d-none d-md-table-cell">Editar</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pedido of pedidosFiltrados$ | async">
                  <td>{{ getClienteNombre(pedido.clienteId) }}</td>
                  <td class="text-center">
                    {{ getFechaEntrega(pedido.fechaEntrega) }}
                  </td>
                  <td class="text-center ">
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
                        
                      <i class="fa-regular fa-eye"></i>
                      </button>
                      <button
                        *ngIf="pedido.estado !== 'entregado'"
                        class="btn btn-success btn-sm w-100 w-md-auto d-none d-md-inline-block"
                        (click)="marcarComoEntregado(pedido)"
                      >Entregado
                      </button>
                    </div> 
                  </td>
                  <td class="text-center d-none d-md-table-cell">
                    <button
                      class="btn btn-info btn-sm w-100 w-md-auto"
                      (click)="editarPedido(pedido.id)"
                    >
                     <i class="fa-solid fa-pencil"></i>
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

  estadoTab: string = 'todos';

  pedidosFiltrados$: Observable<Pedido[]> = combineLatest([
    this.pedidos$,
    this.clienteSearch$,
    this.fechaEntrega$,
    this.page$,
  ]).pipe(
    map(([pedidos, clienteSearch, fechaEntrega, page]) => {
      let filtrados = pedidos.filter((p) => {
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

      // Filtro por estado
      if (this.estadoTab !== 'todos') {
        filtrados = filtrados.filter(p => p.estado === this.estadoTab);
      }

      // Ordenar por fecha de entrega descendente (más reciente primero)
      filtrados.sort((a, b) => {
        const getDate = (f: any) => {
          if (!f) return 0;
          if (typeof f === 'string') return new Date(f).getTime();
          if (f instanceof Date) return f.getTime();
          if (typeof f === 'object' && typeof f.toDate === 'function') return f.toDate().getTime();
          return 0;
        };
        return getDate(b.fechaEntrega) - getDate(a.fechaEntrega);
      });

      this.totalPages = Math.max(1, Math.ceil(filtrados.length / this.pageSize));
      const paginaValida = Math.min(Math.max(page, 1), this.totalPages);
      if (paginaValida !== this.page) this.page = paginaValida;
      if (paginaValida !== page) this.page$.next(paginaValida);

      const start = (paginaValida - 1) * this.pageSize;
      return filtrados.slice(start, start + this.pageSize);
    }),
  );

  setEstadoTab(tab: string) {
    this.estadoTab = tab;
    this.page = 1;
    this.page$.next(1);
  }
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

