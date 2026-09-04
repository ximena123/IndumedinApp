import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { BehaviorSubject, Observable, combineLatest, firstValueFrom } from 'rxjs'
import { map, shareReplay, startWith, tap } from 'rxjs/operators'
import { Cliente } from '../models/cliente.model'
import { Pedido } from '../models/pedido.model'
import { PedidosService } from '../pedidos/pedidos.service'
import { ResumenComponent } from '../resumen/resumen.component'
import { PaginacionComponent, paginar } from '../shared/paginacion.component'
import { matchesSearch } from '../shared/search.util'
import { ClientesService } from './clientes.service'

@Component({
  standalone: true,
  selector: 'app-clientes-list',
  imports: [CommonModule, ReactiveFormsModule, ResumenComponent, PaginacionComponent],
  template: `
    <div class="row">
      <div class="col-lg-8 col-md-12">
        <!-- Modal normalizar -->
        <div class="modal fade" [class.show]="mostrarModalNormalizar" [style.display]="mostrarModalNormalizar ? 'block' : 'none'" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-warning">
                <h5 class="modal-title">Normalizar nombres</h5>
              </div>
              <div class="modal-body">
                <p class="mb-1">Se van a actualizar los nombres y apellidos de todos los clientes al formato <strong>Title Case</strong> (ejemplo: <em>juan PEREZ</em> → <em>Juan Perez</em>).</p>
                <p class="text-muted small mb-0">La operación es segura: solo afecta clientes cuyo nombre o apellido cambie con la normalización.</p>
                <div *ngIf="resultadoNormalizar" class="alert alert-info mt-3 mb-0">
                  {{ resultadoNormalizar }}
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="cerrarModalNormalizar()" [disabled]="normalizando">Cerrar</button>
                <button type="button" class="btn btn-warning" (click)="ejecutarNormalizacion()" [disabled]="normalizando">
                  <span *ngIf="normalizando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Normalizar ahora
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-backdrop fade show" *ngIf="mostrarModalNormalizar"></div>

        <!-- Modal confirmar eliminación -->
        <div class="modal fade" [class.show]="mostrarModalEliminar" [style.display]="mostrarModalEliminar ? 'block' : 'none'" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">Eliminar cliente</h5>
              </div>
              <div class="modal-body">
                <p>¿Estás segura de que deseas eliminar a <strong>{{ clienteEliminar?.nombreCompleto }} {{ clienteEliminar?.apellidos }}</strong>?</p>
                <p *ngIf="pedidosDelCliente > 0" class="text-danger mb-0">
                  <i class="fa-solid fa-triangle-exclamation me-1"></i>
                  Este cliente tiene <strong>{{ pedidosDelCliente }}</strong> pedido{{ pedidosDelCliente === 1 ? '' : 's' }} asociado{{ pedidosDelCliente === 1 ? '' : 's' }} que también se eliminarán.
                </p>
                <p *ngIf="pedidosDelCliente === 0" class="text-muted mb-0">Esta acción no se puede deshacer.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="cancelarEliminar()" [disabled]="eliminando">Cancelar</button>
                <button type="button" class="btn btn-danger" (click)="confirmarEliminar()" [disabled]="eliminando">
                  <span *ngIf="eliminando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <i *ngIf="!eliminando" class="fa-solid fa-trash me-1"></i> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-backdrop fade show" *ngIf="mostrarModalEliminar"></div>

        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h2 class="mb-0 fw-bold">Clientes</h2>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-warning" (click)="abrirModalNormalizar()" title="Normalizar nombres y apellidos">
              <i class="fa-solid fa-wand-magic-sparkles me-1"></i> Normalizar nombres
            </button>
            <button class="btn btn-primary" (click)="nuevoCliente()">
              <i class="fa-solid fa-plus me-1"></i> Nuevo cliente
            </button>
          </div>
        </div>
        <div class="mb-3">
          <div class="input-group" style="max-width: 400px;">
            <span class="input-group-text"><i class="fa-solid fa-search"></i></span>
            <input type="text" class="form-control" placeholder="Buscar por nombre o apellido..." [formControl]="busquedaControl">
          </div>
        </div>

        <!-- Vista mobile: cards -->
        <div class="d-block d-md-none">
          <div class="card mb-2 shadow-sm" *ngFor="let cliente of clientesFiltrados$ | async">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="fw-bold mb-1">{{cliente.nombreCompleto}} {{cliente.apellidos}}</h6>
                  <div class="text-muted small">
                    <i class="fa-solid fa-phone me-1"></i> {{cliente.telefono}}
                  </div>
                  <div class="text-muted small" *ngIf="cliente.profesion">
                    <i class="fa-solid fa-briefcase me-1"></i> {{cliente.profesion}}
                  </div>
                  <div class="mt-1 small" *ngIf="cliente.tallaCamisa || cliente.tallaPantalon">
                    <span class="badge bg-light text-dark me-1" *ngIf="cliente.tallaCamisa">Camisa: {{cliente.tallaCamisa}}</span>
                    <span class="badge bg-light text-dark" *ngIf="cliente.tallaPantalon">Pantalon: {{cliente.tallaPantalon}}</span>
                  </div>
                </div>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary" (click)="editarCliente(cliente.id)" title="Editar">
                    <i class="fa-solid fa-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger" (click)="solicitarEliminar(cliente)" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vista desktop: tabla -->
        <div class="table-responsive d-none d-md-block">
          <table class="table table-hover align-middle mb-0 bg-white">
            <thead>
              <tr class="table-light">
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Telefono</th>
                <th>Profesion</th>
                <th class="text-center">Camisa</th>
                <th class="text-center">Pantalon</th>
                <th>Especificaciones</th>
                <th class="text-center" style="width: 120px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cliente of clientesFiltrados$ | async">
                <td class="fw-semibold">{{cliente.nombreCompleto}}</td>
                <td>{{cliente.apellidos}}</td>
                <td>{{cliente.telefono}}</td>
                <td>{{cliente.profesion}}</td>
                <td class="text-center">{{cliente.tallaCamisa}}</td>
                <td class="text-center">{{cliente.tallaPantalon}}</td>
                <td class="text-muted" style="max-width: 180px; font-size: 13px;">{{cliente.especificaciones}}</td>
                <td class="text-center">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" (click)="editarCliente(cliente.id)" title="Editar">
                      <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" (click)="solicitarEliminar(cliente)" title="Eliminar">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="text-center text-muted py-5" *ngIf="cargando">
          <span class="spinner-border spinner-border-sm me-2"></span> Cargando clientes...
        </div>
        <div class="text-center text-muted py-4" *ngIf="!cargando && totalResultados === 0">
          <i class="fa-regular fa-folder-open me-2"></i> No hay clientes que mostrar.
        </div>

        <app-paginacion
          *ngIf="!cargando"
          etiqueta="cliente"
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
  `
})
export class ClientesListComponent {
  page = 1
  pageSize = 10
  totalPages = 1
  cargando = true
  totalResultados = 0
  desdeResultado = 0
  hastaResultado = 0
  clientes$: Observable<Cliente[]> = this.clientesService.getClientes().pipe(
    map((clientes: any) => clientes ?? [])
  );
  busquedaControl = new FormControl('');
  private page$ = new BehaviorSubject<number>(1);
  private busqueda$ = this.busquedaControl.valueChanges.pipe(
    startWith(''),
    tap(() => this.setPage(1))
  )
  clientesFiltrados$: Observable<Cliente[]> = combineLatest([
    this.clientes$,
    this.busqueda$,
    this.page$
  ]).pipe(
    map(([clientes, filtro, page]) => {
      const lista = Array.isArray(clientes) ? clientes : [];
      const f = filtro || '';
      const filtrados = lista.filter((c) =>
        matchesSearch(`${c.nombreCompleto ?? ''} ${c.apellidos ?? ''}`, f),
      );
      const resultado = paginar(filtrados, page, this.pageSize);
      this.cargando = false;
      this.totalResultados = resultado.total;
      this.totalPages = resultado.totalPages;
      this.page = resultado.page;
      this.desdeResultado = resultado.desde;
      this.hastaResultado = resultado.hasta;
      if (resultado.page !== page) {
        this.page$.next(resultado.page);
      }
      return resultado.items;
    }),
    // La plantilla se suscribe varias veces (mobile/desktop): sin esto el
    // paginado se recalcularía en cada suscripción.
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  mostrarModalNormalizar = false;
  normalizando = false;
  resultadoNormalizar = '';
  mostrarModalEliminar = false;
  clienteEliminar: Cliente | null = null;
  pedidosDelCliente = 0;
  eliminando = false;

  constructor(
    private clientesService: ClientesService,
    private pedidosService: PedidosService,
    private router: Router,
  ) {}

  nuevoCliente() { this.router.navigate(['/clientes/nuevo']); }
  editarCliente(id: string) { this.router.navigate(['/clientes/editar', id]); }

  async solicitarEliminar(cliente: Cliente): Promise<void> {
    this.clienteEliminar = cliente;
    const pedidos = await firstValueFrom(this.pedidosService.getPedidosByCliente(cliente.id));
    this.pedidosDelCliente = pedidos.length;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminar(): void {
    this.mostrarModalEliminar = false;
    this.clienteEliminar = null;
    this.pedidosDelCliente = 0;
  }

  async confirmarEliminar(): Promise<void> {
    if (!this.clienteEliminar || this.eliminando) return;
    this.eliminando = true;
    try {
      const id = this.clienteEliminar.id;
      const pedidos: Pedido[] = await firstValueFrom(this.pedidosService.getPedidosByCliente(id));
      await Promise.all(pedidos.map((p) => this.pedidosService.deletePedido(p.id)));
      await this.clientesService.deleteCliente(id);
      this.cancelarEliminar();
    } finally {
      this.eliminando = false;
    }
  }
  setPage(page: number) {
    const paginaValida = Math.min(Math.max(page, 1), this.totalPages || 1);
    this.page = paginaValida;
    this.page$.next(paginaValida);
  }

  abrirModalNormalizar(): void {
    this.resultadoNormalizar = '';
    this.mostrarModalNormalizar = true;
  }

  cerrarModalNormalizar(): void {
    this.mostrarModalNormalizar = false;
  }

  async ejecutarNormalizacion(): Promise<void> {
    if (this.normalizando) return;
    this.normalizando = true;
    this.resultadoNormalizar = '';
    try {
      const clientes = await firstValueFrom(this.clientesService.getClientes());
      const cambios: Array<{ id: string; nombreCompleto: string; apellidos: string }> = [];
      for (const c of clientes) {
        const nuevoNombre = this.toTitleCase(c.nombreCompleto ?? '');
        const nuevoApellidos = this.toTitleCase(c.apellidos ?? '');
        if (nuevoNombre !== (c.nombreCompleto ?? '') || nuevoApellidos !== (c.apellidos ?? '')) {
          cambios.push({ id: c.id, nombreCompleto: nuevoNombre, apellidos: nuevoApellidos });
        }
      }
      for (const cambio of cambios) {
        await this.clientesService.updateCliente(cambio.id, {
          nombreCompleto: cambio.nombreCompleto,
          apellidos: cambio.apellidos,
        });
      }
      this.resultadoNormalizar = `Listo. ${cambios.length} de ${clientes.length} clientes actualizados.`;
    } catch (e) {
      this.resultadoNormalizar = 'Ocurrió un error durante la normalización.';
    } finally {
      this.normalizando = false;
    }
  }

  private toTitleCase(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .map((w) => (w ? w.charAt(0).toLocaleUpperCase() + w.slice(1) : ''))
      .join(' ');
  }
}
