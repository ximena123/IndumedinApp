import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { BehaviorSubject, Observable, combineLatest, firstValueFrom } from 'rxjs'
import { map } from 'rxjs/operators'
import { ClientesService } from '../clientes/clientes.service'
import { Pedido } from '../models/pedido.model'
import { PedidosEmpresaService } from '../pedidos-empresa/pedidos-empresa.service'
import { ResumenComponent } from '../resumen/resumen.component'
import { PedidosFiltrosService } from './pedidos-filtros.service'
import { PedidosService } from './pedidos.service'

interface PedidoListRow {
  id: string;
  tipo: 'individual' | 'empresa';
  nombre: string;
  responsable?: string;
  empresaSubtitulo?: string;
  fechaEntrega: unknown;
  estado: string;
  descripcion: string;
  precio: number;
  abono: number;
  saldo: number;
}

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
    <!-- Modal confirmar eliminación -->
    <div class="modal fade" [class.show]="mostrarModalEliminar" [style.display]="mostrarModalEliminar ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Eliminar pedido</h5>
          </div>
          <div class="modal-body">
            <p *ngIf="filaEliminar?.tipo === 'empresa'">
              ¿Estás segura de que deseas eliminar el pedido de empresa <strong>{{ filaEliminar?.nombre }}</strong>? Se eliminarán también todos los pedidos de empleados asociados.
            </p>
            <p *ngIf="filaEliminar?.tipo !== 'empresa'">¿Estás segura de que deseas eliminar este pedido?</p>
            <p class="text-muted mb-0">Esta acción no se puede deshacer.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cancelarEliminar()">Cancelar</button>
            <button type="button" class="btn btn-danger" (click)="confirmarEliminar()">
              <i class="fa-solid fa-trash me-1"></i> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="mostrarModalEliminar"></div>

    <div class="row">
      <div class="col-lg-8 col-md-12">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="mb-0 fw-bold">Pedidos</h2>
            <button class="btn btn-primary" (click)="nuevoPedido()">
              <i class="fa-solid fa-plus me-1"></i> Nuevo pedido
            </button>
          </div>
          <ul class="nav nav-pills mb-3 gap-1">
            <li class="nav-item">
              <a class="nav-link" [class.active]="estadoTab === 'todos'" (click)="setEstadoTab('todos')" role="button">Todos</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="estadoTab === 'pendiente'" (click)="setEstadoTab('pendiente')" role="button">Pendiente</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="estadoTab === 'en_proceso'" (click)="setEstadoTab('en_proceso')" role="button">En proceso</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="estadoTab === 'entregado'" (click)="setEstadoTab('entregado')" role="button">Entregado</a>
            </li>
          </ul>
          <div class="mb-3 row g-2 align-items-center">
            <div class="col-md-6 pedidos-filtros">
              <div class="input-group">
                <span class="input-group-text"><i class="fa-solid fa-search"></i></span>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Buscar cliente o empresa..."
                  [(ngModel)]="busquedaCliente"
                  (input)="onClienteSearch(busquedaCliente)"
                />
              </div>
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
                class="btn btn-outline-secondary w-100"
                (click)="borrarFiltros()"
              >
                <i class="fa-solid fa-xmark me-1"></i> Borrar filtro
              </button>
            </div>
          </div>
          <!-- Vista mobile: cards -->
          <div class="d-block d-md-none">
            <div class="card mb-2 shadow-sm" *ngFor="let fila of pedidosFiltrados$ | async">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 class="card-title mb-0 fw-bold">
                      <i class="fa-solid fa-building me-1 text-info" *ngIf="fila.tipo === 'empresa'"></i>
                      {{ fila.nombre }}
                    </h6>
                    <small class="text-muted" *ngIf="fila.empresaSubtitulo">{{ fila.empresaSubtitulo }}</small>
                  </div>
                  <span class="badge"
                    [class.bg-warning]="fila.estado === 'pendiente'"
                    [class.text-dark]="fila.estado === 'pendiente'"
                    [class.bg-primary]="fila.estado === 'en_proceso'"
                    [class.bg-info]="fila.estado === 'terminado'"
                    [class.bg-success]="fila.estado === 'entregado'">
                    {{ fila.estado === 'en_proceso' ? 'En proceso' : fila.estado }}
                  </span>
                </div>
                <div class="text-muted small mb-2">
                  <i class="fa-regular fa-calendar me-1"></i> {{ getFechaEntrega(fila.fechaEntrega) }}
                  <span class="ms-3"><strong>\${{ fila.precio }}</strong></span>
                  <span class="ms-2 text-danger" *ngIf="fila.saldo > 0">(Saldo: \${{ fila.saldo }})</span>
                </div>
                <div class="d-flex gap-2">
                  <button class="btn btn-warning btn-sm flex-fill" (click)="verDetalle(fila)">
                    <i class="fa-regular fa-eye me-1"></i> Ver
                  </button>
                  <button class="btn btn-info btn-sm flex-fill" (click)="editarFila(fila)">
                    <i class="fa-solid fa-pencil me-1"></i> Editar
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="solicitarEliminar(fila)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <!-- Vista desktop: tabla -->
          <div class="card border-0 shadow-sm d-none d-md-block">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 bg-white">
              <thead>
                <tr class="table-light">
                  <th>Cliente / Empresa</th>
                  <th class="text-center">Entrega</th>
                  <th class="text-center">Estado</th>
                  <th>Descripción</th>
                  <th class="text-end">Precio</th>
                  <th class="text-end">Abono</th>
                  <th class="text-end">Saldo</th>
                  <th class="text-center" style="width: 200px;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let fila of pedidosFiltrados$ | async">
                  <td class="fw-semibold">
                    <i class="fa-solid fa-building me-1 text-info" *ngIf="fila.tipo === 'empresa'"></i>
                    {{ fila.nombre }}
                    <div *ngIf="fila.empresaSubtitulo" class="small text-muted fw-normal">{{ fila.empresaSubtitulo }}</div>
                  </td>
                  <td class="text-center text-nowrap">{{ getFechaEntrega(fila.fechaEntrega) }}</td>
                  <td class="text-center">
                    <span class="badge rounded-pill"
                      [class.bg-warning]="fila.estado === 'pendiente'"
                      [class.text-dark]="fila.estado === 'pendiente'"
                      [class.bg-primary]="fila.estado === 'en_proceso'"
                      [class.bg-info]="fila.estado === 'terminado'"
                      [class.bg-success]="fila.estado === 'entregado'">
                      {{ fila.estado === 'en_proceso' ? 'En proceso' : fila.estado }}
                    </span>
                  </td>
                  <td class="text-muted" style="font-size: 13px; max-width: 220px;">
                    {{ fila.descripcion.length > 80 ? (fila.descripcion | slice: 0 : 80) + '...' : fila.descripcion }}
                  </td>
                  <td class="text-end">\${{ fila.precio }}</td>
                  <td class="text-end">\${{ fila.abono }}</td>
                  <td class="text-end fw-bold" [class.text-danger]="fila.saldo > 0">\${{ fila.saldo }}</td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-secondary" (click)="verDetalle(fila)" title="Ver detalle">
                        <i class="fa-regular fa-eye"></i>
                      </button>
                      <button class="btn btn-outline-primary" (click)="editarFila(fila)" title="Editar">
                        <i class="fa-solid fa-pencil"></i>
                      </button>
                      <button *ngIf="fila.estado !== 'entregado'" class="btn btn-outline-success" (click)="marcarComoEntregado(fila)" title="Marcar entregado">
                        <i class="fa-solid fa-check"></i>
                      </button>
                      <button class="btn btn-outline-danger" (click)="solicitarEliminar(fila)" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        </div>
        <nav *ngIf="totalPages > 1">
          <ul class="pagination justify-content-center flex-wrap">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" (click)="setPage(page - 1)">&laquo;</button>
            </li>
            <ng-container *ngFor="let p of [].constructor(totalPages); let i = index">
              <li class="page-item" [class.active]="page === i + 1"
                *ngIf="i + 1 === 1 || i + 1 === totalPages || (i + 1 >= page - 1 && i + 1 <= page + 1)">
                <button class="page-link" (click)="setPage(i + 1)">{{ i + 1 }}</button>
              </li>
              <li class="page-item disabled" *ngIf="(i + 1 === page - 2 && page > 3) || (i + 1 === page + 2 && page < totalPages - 2)">
                <span class="page-link">...</span>
              </li>
            </ng-container>
            <li class="page-item" [class.disabled]="page === totalPages">
              <button class="page-link" (click)="setPage(page + 1)">&raquo;</button>
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
  mostrarModalEliminar = false;
  filaEliminar: PedidoListRow | null = null;
  estadoTab = 'todos';
  clientesMap: Record<string, string> = {};

  private page$ = new BehaviorSubject<number>(1);
  private clienteSearch$ = new BehaviorSubject<string>('');
  private fechaEntrega$ = new BehaviorSubject<string>('');

  private filas$: Observable<PedidoListRow[]> = combineLatest([
    this.pedidosService.getPedidos(),
    this.pedidosEmpresaService.getPedidosEmpresa(),
  ]).pipe(
    map(([pedidos, empresas]) => {
      const individuales: PedidoListRow[] = pedidos
        .filter((p) => !p.pedidoEmpresaId)
        .map((p) => ({
          id: p.id,
          tipo: 'individual' as const,
          nombre: this.getClienteNombre(p.clienteId),
          fechaEntrega: p.fechaEntrega,
          estado: p.estado,
          descripcion: p.descripcion ?? '',
          precio: p.precio ?? 0,
          abono: p.abono ?? 0,
          saldo: p.saldo ?? 0,
        }));

      const empresaFilas: PedidoListRow[] = empresas.map((e) => {
        const hijos = pedidos.filter((p) => p.pedidoEmpresaId === e.id);
        const precio = hijos.reduce((acc, p) => acc + (p.precio ?? 0), 0);
        const abono = hijos.reduce((acc, p) => acc + (p.abono ?? 0), 0);
        return {
          id: e.id,
          tipo: 'empresa' as const,
          nombre: e.nombreEmpresa,
          responsable: e.responsable,
          empresaSubtitulo: `${hijos.length} empleado${hijos.length === 1 ? '' : 's'} · Resp: ${e.responsable}`,
          fechaEntrega: e.fechaEntrega,
          estado: e.estado,
          descripcion: e.descripcion ?? '',
          precio,
          abono,
          saldo: precio - abono,
        };
      });

      return [...individuales, ...empresaFilas];
    }),
  );

  pedidosFiltrados$: Observable<PedidoListRow[]> = combineLatest([
    this.filas$,
    this.clienteSearch$,
    this.fechaEntrega$,
    this.page$,
  ]).pipe(
    map(([filas, search, fechaEntrega, page]) => {
      const term = (search || '').toLowerCase();
      let filtrados = filas.filter((f) => {
        const nombreCoincide =
          !term ||
          f.nombre.toLowerCase().includes(term) ||
          (f.responsable ?? '').toLowerCase().includes(term);
        if (!fechaEntrega) return nombreCoincide;
        const filaFechaStr = this.toFechaStr(f.fechaEntrega);
        return nombreCoincide && filaFechaStr === fechaEntrega;
      });

      if (this.estadoTab !== 'todos') {
        filtrados = filtrados.filter((f) => f.estado === this.estadoTab);
      }

      filtrados.sort((a, b) => {
        const da = this.toTimestamp(a.fechaEntrega);
        const db = this.toTimestamp(b.fechaEntrega);
        return db - da;
      });

      this.totalPages = Math.max(1, Math.ceil(filtrados.length / this.pageSize));
      const paginaValida = Math.min(Math.max(page, 1), this.totalPages);
      if (paginaValida !== this.page) this.page = paginaValida;
      if (paginaValida !== page) this.page$.next(paginaValida);

      const start = (paginaValida - 1) * this.pageSize;
      return filtrados.slice(start, start + this.pageSize);
    }),
  );

  constructor(
    private pedidosService: PedidosService,
    private clientesService: ClientesService,
    private router: Router,
    private filtrosService: PedidosFiltrosService,
    private pedidosEmpresaService: PedidosEmpresaService,
  ) {
    const saved = this.filtrosService.get();
    this.busquedaCliente = saved.busquedaCliente;
    this.busquedaFecha = saved.busquedaFecha;
    this.estadoTab = saved.estadoTab;
    this.page = saved.page;
    this.page$.next(saved.page);
    this.clienteSearch$.next(saved.busquedaCliente);
    this.fechaEntrega$.next(saved.busquedaFecha);

    this.clientesService.getClientes().subscribe((clientes) => {
      this.clientesMap = {};
      clientes.forEach((c) => {
        this.clientesMap[c.id] = `${c.nombreCompleto} ${c.apellidos}`;
      });
    });
  }

  borrarFiltros() {
    this.busquedaCliente = '';
    this.busquedaFecha = '';
    this.estadoTab = 'todos';
    this.filtrosService.reset();
    this.onClienteSearch('');
    this.onFechaEntrega('');
  }

  nuevoPedido() {
    this.router.navigate(['/pedidos/nuevo']);
  }

  formatDateYMD(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private toFechaStr(fecha: unknown): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') {
      return fecha.length >= 10 ? fecha.substring(0, 10) : fecha;
    }
    if (fecha instanceof Date) return this.formatDateYMD(fecha);
    if (typeof fecha === 'object' && fecha && typeof (fecha as { toDate?: () => Date }).toDate === 'function') {
      return this.formatDateYMD((fecha as { toDate: () => Date }).toDate());
    }
    return '';
  }

  private toTimestamp(fecha: unknown): number {
    if (!fecha) return 0;
    if (typeof fecha === 'string') return new Date(fecha).getTime();
    if (fecha instanceof Date) return fecha.getTime();
    if (typeof fecha === 'object' && fecha && typeof (fecha as { toDate?: () => Date }).toDate === 'function') {
      return (fecha as { toDate: () => Date }).toDate().getTime();
    }
    return 0;
  }

  getFechaEntrega(fecha: unknown): string {
    return this.toFechaStr(fecha);
  }

  getClienteNombre(id: string): string {
    return this.clientesMap[id] || id;
  }

  setEstadoTab(tab: string) {
    this.estadoTab = tab;
    this.filtrosService.set({ estadoTab: tab, page: 1 });
    this.page = 1;
    this.page$.next(1);
  }

  verDetalle(fila: PedidoListRow) {
    if (fila.tipo === 'empresa') {
      this.router.navigate(['/pedidos-empresa', fila.id]);
    } else {
      this.router.navigate(['/pedidos', fila.id]);
    }
  }

  editarFila(fila: PedidoListRow) {
    if (fila.tipo === 'empresa') {
      this.router.navigate(['/pedidos-empresa/editar', fila.id]);
    } else {
      this.router.navigate(['/pedidos/editar', fila.id]);
    }
  }

  onClienteSearch(value: string) {
    this.page = 1;
    this.page$.next(1);
    this.clienteSearch$.next(value);
    this.filtrosService.set({ busquedaCliente: value, page: 1 });
  }

  onFechaEntrega(value: string) {
    this.page = 1;
    this.page$.next(1);
    this.fechaEntrega$.next(value);
    this.filtrosService.set({ busquedaFecha: value, page: 1 });
  }

  async marcarComoEntregado(fila: PedidoListRow) {
    if (fila.estado === 'entregado') return;
    if (fila.tipo === 'empresa') {
      await this.pedidosEmpresaService.updatePedidoEmpresa(fila.id, { estado: 'entregado' });
      const hijos = await firstValueFrom(this.pedidosService.getPedidosByEmpresa(fila.id));
      await Promise.all(
        hijos.map((p) =>
          this.pedidosService.updatePedido(p.id, {
            estado: 'entregado',
            abono: p.precio ?? 0,
            saldo: 0,
          }),
        ),
      );
    } else {
      const precio = fila.precio ?? 0;
      await this.pedidosService.updatePedido(fila.id, {
        estado: 'entregado',
        abono: precio,
        saldo: 0,
      });
    }
  }

  solicitarEliminar(fila: PedidoListRow) {
    this.filaEliminar = fila;
    this.mostrarModalEliminar = true;
  }

  async confirmarEliminar() {
    const fila = this.filaEliminar;
    if (!fila) {
      this.cancelarEliminar();
      return;
    }
    if (fila.tipo === 'empresa') {
      const hijos = await firstValueFrom(this.pedidosService.getPedidosByEmpresa(fila.id));
      await Promise.all(hijos.map((p) => this.pedidosService.deletePedido(p.id)));
      await this.pedidosEmpresaService.deletePedidoEmpresa(fila.id);
    } else {
      await this.pedidosService.deletePedido(fila.id);
    }
    this.cancelarEliminar();
  }

  cancelarEliminar() {
    this.mostrarModalEliminar = false;
    this.filaEliminar = null;
  }

  setPage(page: number) {
    const paginaValida = Math.min(Math.max(page, 1), this.totalPages || 1);
    this.page = paginaValida;
    this.page$.next(paginaValida);
    this.filtrosService.set({ page: paginaValida });
  }
}
