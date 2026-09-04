import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { BehaviorSubject, Observable, combineLatest } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'
import { Pedido } from '../models/pedido.model'
import { PedidoEmpresa } from '../models/pedido-empresa.model'
import { PedidosService } from '../pedidos/pedidos.service'
import { ResumenComponent } from '../resumen/resumen.component'
import { redondearArriba2, totalPedido } from '../shared/money.util'
import { PaginacionComponent, paginar } from '../shared/paginacion.component'
import { matchesSearch } from '../shared/search.util'
import { PedidosEmpresaFiltrosService } from './pedidos-empresa-filtros.service'
import { PedidosEmpresaService } from './pedidos-empresa.service'

interface PedidoEmpresaResumen extends PedidoEmpresa {
  numeroEmpleados: number;
  valorTotal: number;
  totalAbonado: number;
  saldoPendiente: number;
  totalMostrado: number;
  saldoMostrado: number;
  esTotalGlobal: boolean;
}

@Component({
  standalone: true,
  selector: 'app-pedidos-empresa-list',
  imports: [CommonModule, FormsModule, ResumenComponent, PaginacionComponent],
  template: `
    <!-- Modal confirmar eliminación -->
    <div class="modal fade" [class.show]="mostrarModalEliminar" [style.display]="mostrarModalEliminar ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Eliminar pedido de empresa</h5>
          </div>
          <div class="modal-body">
            <p>¿Estás segura de que deseas eliminar este pedido de empresa?</p>
            <p class="text-muted mb-0">Se eliminará la empresa y todos los pedidos de empleados asociados.</p>
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
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0 fw-bold">Pedidos de Empresa</h2>
      <button class="btn btn-primary" (click)="nuevoPedidoEmpresa()">
        <i class="fa-solid fa-plus me-1"></i> Nuevo pedido empresa
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
      <div class="col-md-9">
        <div class="input-group">
          <span class="input-group-text"><i class="fa-solid fa-search"></i></span>
          <input
            type="text"
            class="form-control"
            placeholder="Buscar por empresa o responsable..."
            [(ngModel)]="busqueda"
            (input)="onBusqueda(busqueda)"
          />
        </div>
      </div>
      <div class="col-md-3">
        <button class="btn btn-outline-secondary w-100" (click)="borrarFiltros()">
          <i class="fa-solid fa-xmark me-1"></i> Borrar filtro
        </button>
      </div>
    </div>

    <!-- Mobile -->
    <div class="d-block d-md-none">
      <div class="card mb-2 shadow-sm" *ngFor="let pe of pedidosFiltrados$ | async">
        <div class="card-body p-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="card-title mb-0 fw-bold">{{ pe.nombreEmpresa }}</h6>
            <span class="badge"
              [class.bg-warning]="pe.estado === 'pendiente'"
              [class.text-dark]="pe.estado === 'pendiente'"
              [class.bg-primary]="pe.estado === 'en_proceso'"
              [class.bg-info]="pe.estado === 'terminado'"
              [class.bg-success]="pe.estado === 'entregado'">
              {{ pe.estado === 'en_proceso' ? 'En proceso' : pe.estado }}
            </span>
          </div>
          <div class="text-muted small mb-1">
            <i class="fa-solid fa-user-tie me-1"></i> {{ pe.responsable }} — {{ pe.telefonoResponsable }}
          </div>
          <div class="text-muted small mb-2">
            <i class="fa-regular fa-calendar me-1"></i> {{ pe.fechaEntrega }}
            <span class="ms-2"><i class="fa-solid fa-users me-1"></i>{{ pe.numeroEmpleados }}</span>
            <span class="ms-2">
              <strong>\${{ pe.totalMostrado }}</strong>
              <i *ngIf="pe.esTotalGlobal" class="fa-solid fa-handshake ms-1 text-info" title="Total acordado con la empresa"></i>
            </span>
            <span class="ms-2 text-danger" *ngIf="pe.saldoMostrado > 0">(Saldo: \${{ pe.saldoMostrado }})</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-warning btn-sm flex-fill" (click)="verDetalle(pe.id)">
              <i class="fa-regular fa-eye me-1"></i> Ver
            </button>
            <button class="btn btn-info btn-sm flex-fill" (click)="editarPedidoEmpresa(pe.id)">
              <i class="fa-solid fa-pencil me-1"></i> Editar
            </button>
            <button class="btn btn-danger btn-sm" (click)="solicitarEliminar(pe.id)">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="text-center text-muted py-4" *ngIf="(pedidosFiltrados$ | async)?.length === 0">
        No hay pedidos de empresa.
      </div>
    </div>

    <!-- Desktop -->
    <div class="card border-0 shadow-sm d-none d-md-block">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 bg-white">
          <thead>
            <tr class="table-light">
              <th>Empresa</th>
              <th>Responsable</th>
              <th class="text-center">Entrega</th>
              <th class="text-center">Empleados</th>
              <th class="text-center">Estado</th>
              <th class="text-end">Total</th>
              <th class="text-end">Saldo</th>
              <th class="text-center" style="width: 200px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pe of pedidosFiltrados$ | async">
              <td class="fw-semibold">{{ pe.nombreEmpresa }}</td>
              <td>
                <div>{{ pe.responsable }}</div>
                <small class="text-muted">{{ pe.telefonoResponsable }}</small>
              </td>
              <td class="text-center text-nowrap">{{ pe.fechaEntrega }}</td>
              <td class="text-center">{{ pe.numeroEmpleados }}</td>
              <td class="text-center">
                <span class="badge rounded-pill"
                  [class.bg-warning]="pe.estado === 'pendiente'"
                  [class.text-dark]="pe.estado === 'pendiente'"
                  [class.bg-primary]="pe.estado === 'en_proceso'"
                  [class.bg-info]="pe.estado === 'terminado'"
                  [class.bg-success]="pe.estado === 'entregado'">
                  {{ pe.estado === 'en_proceso' ? 'En proceso' : pe.estado }}
                </span>
              </td>
              <td class="text-end">
                \${{ pe.totalMostrado }}
                <i *ngIf="pe.esTotalGlobal" class="fa-solid fa-handshake ms-1 text-info" title="Total acordado con la empresa"></i>
              </td>
              <td class="text-end fw-bold" [class.text-danger]="pe.saldoMostrado > 0">\${{ pe.saldoMostrado }}</td>
              <td class="text-center">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" (click)="verDetalle(pe.id)" title="Ver detalle">
                    <i class="fa-regular fa-eye"></i>
                  </button>
                  <button class="btn btn-outline-primary" (click)="editarPedidoEmpresa(pe.id)" title="Editar">
                    <i class="fa-solid fa-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger" (click)="solicitarEliminar(pe.id)" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="(pedidosFiltrados$ | async)?.length === 0">
              <td colspan="8" class="text-center text-muted py-4">No hay pedidos de empresa.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <app-paginacion
      etiqueta="pedido de empresa"
      etiquetaPlural="pedidos de empresa"
      [enTarjeta]="false"
      [page]="page"
      [totalPages]="totalPages"
      [total]="totalResultados"
      [desde]="desdeResultado"
      [hasta]="hastaResultado"
      (pageChange)="setPage($event)">
    </app-paginacion>
      </div>
      <div class="col-lg-4 d-none d-lg-block">
        <app-resumen></app-resumen>
      </div>
    </div>
  `,
})
export class PedidosEmpresaListComponent {
  busqueda = '';
  estadoTab = 'todos';
  mostrarModalEliminar = false;
  pedidoEmpresaIdEliminar: string | null = null;

  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalResultados = 0;
  desdeResultado = 0;
  hastaResultado = 0;

  private busqueda$ = new BehaviorSubject<string>('');
  private estadoTab$ = new BehaviorSubject<string>('todos');
  private page$ = new BehaviorSubject<number>(1);

  pedidosEmpresa$: Observable<PedidoEmpresa[]> = this.pedidosEmpresaService.getPedidosEmpresa();
  pedidos$: Observable<Pedido[]> = this.pedidosService.getPedidos();

  pedidosFiltrados$: Observable<PedidoEmpresaResumen[]> = combineLatest([
    this.pedidosEmpresa$,
    this.pedidos$,
    this.busqueda$,
    this.estadoTab$,
    this.page$,
  ]).pipe(
    map(([empresas, pedidos, busqueda, estado, page]) => {
      const term = busqueda || '';

      const empresasConResumen: PedidoEmpresaResumen[] = empresas.map((e) => {
        const pedidosEmpresa = pedidos.filter((p) => p.pedidoEmpresaId === e.id);
        const valorTotal = redondearArriba2(pedidosEmpresa.reduce((acc, p) => acc + totalPedido(p), 0));
        const totalAbonado = redondearArriba2(pedidosEmpresa.reduce((acc, p) => acc + (p.abono || 0), 0));
        const saldoPendiente = redondearArriba2(valorTotal - totalAbonado);
        const esTotalGlobal = e.total != null;
        const totalMostrado = esTotalGlobal ? (e.total ?? 0) : valorTotal;
        const saldoMostrado = e.saldo != null ? e.saldo : saldoPendiente;
        return {
          ...e,
          numeroEmpleados: pedidosEmpresa.length,
          valorTotal,
          totalAbonado,
          saldoPendiente,
          totalMostrado,
          saldoMostrado,
          esTotalGlobal,
        };
      });

      let filtrados = empresasConResumen;
      if (term) {
        filtrados = filtrados.filter((e) =>
          matchesSearch(`${e.nombreEmpresa ?? ''} ${e.responsable ?? ''}`, term),
        );
      }
      if (estado !== 'todos') {
        filtrados = filtrados.filter((e) => e.estado === estado);
      }

      filtrados.sort((a, b) => {
        const da = a.fechaEntrega ? new Date(a.fechaEntrega).getTime() : 0;
        const db = b.fechaEntrega ? new Date(b.fechaEntrega).getTime() : 0;
        return db - da;
      });

      const resultado = paginar(filtrados, page, this.pageSize);
      this.totalResultados = resultado.total;
      this.totalPages = resultado.totalPages;
      this.page = resultado.page;
      this.desdeResultado = resultado.desde;
      this.hastaResultado = resultado.hasta;
      if (resultado.page !== page) this.page$.next(resultado.page);
      return resultado.items;
    }),
    // La plantilla se suscribe varias veces (mobile/desktop): sin esto el
    // paginado se recalcularía en cada suscripción.
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(
    private pedidosEmpresaService: PedidosEmpresaService,
    private pedidosService: PedidosService,
    private router: Router,
    private filtrosService: PedidosEmpresaFiltrosService,
  ) {
    const saved = this.filtrosService.get();
    this.busqueda = saved.busqueda;
    this.estadoTab = saved.estadoTab;
    this.busqueda$.next(saved.busqueda);
    this.estadoTab$.next(saved.estadoTab);
  }

  onBusqueda(value: string): void {
    this.reiniciarPagina();
    this.busqueda$.next(value);
    this.filtrosService.set({ busqueda: value });
  }

  setEstadoTab(tab: string): void {
    this.estadoTab = tab;
    this.reiniciarPagina();
    this.estadoTab$.next(tab);
    this.filtrosService.set({ estadoTab: tab });
  }

  borrarFiltros(): void {
    this.busqueda = '';
    this.estadoTab = 'todos';
    this.reiniciarPagina();
    this.busqueda$.next('');
    this.estadoTab$.next('todos');
    this.filtrosService.reset();
  }

  setPage(page: number): void {
    const paginaValida = Math.min(Math.max(page, 1), this.totalPages || 1);
    if (paginaValida === this.page) return;
    this.page = paginaValida;
    this.page$.next(paginaValida);
  }

  private reiniciarPagina(): void {
    this.page = 1;
    this.page$.next(1);
  }

  nuevoPedidoEmpresa(): void {
    this.router.navigate(['/pedidos-empresa/nuevo']);
  }

  verDetalle(id: string): void {
    this.router.navigate(['/pedidos-empresa', id]);
  }

  editarPedidoEmpresa(id: string): void {
    this.router.navigate(['/pedidos-empresa/editar', id]);
  }

  solicitarEliminar(id: string): void {
    this.pedidoEmpresaIdEliminar = id;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminar(): void {
    this.mostrarModalEliminar = false;
    this.pedidoEmpresaIdEliminar = null;
  }

  async confirmarEliminar(): Promise<void> {
    const id = this.pedidoEmpresaIdEliminar;
    if (!id) {
      this.cancelarEliminar();
      return;
    }
    const pedidos = await new Promise<Pedido[]>((resolve) => {
      const sub = this.pedidosService.getPedidosByEmpresa(id).subscribe((p) => {
        resolve(p);
        sub.unsubscribe();
      });
    });
    await Promise.all(pedidos.map((p) => this.pedidosService.deletePedido(p.id)));
    await this.pedidosEmpresaService.deletePedidoEmpresa(id);
    this.cancelarEliminar();
  }
}
