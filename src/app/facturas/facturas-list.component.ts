import { CommonModule } from '@angular/common'
import { Component, NgZone, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { Observable, BehaviorSubject, combineLatest, map, shareReplay } from 'rxjs'
import { FacturasService } from './facturas.service'
import { Factura } from '../models/factura.model'
import { ClientesService } from '../clientes/clientes.service'
import { PedidosService } from '../pedidos/pedidos.service'
import { Cliente } from '../models/cliente.model'
import { Pedido } from '../models/pedido.model'
import { FacturaFormComponent } from './factura-form.component'
import { formatMoneda } from '../shared/money.util'
import { PaginacionComponent, paginar } from '../shared/paginacion.component'
import { matchesSearch } from '../shared/search.util'
import { runInZone } from '../shared/run-in-zone.operator'

interface FacturaConDetalles extends Factura {
  cliente?: Cliente;
  pedido?: Pedido;
}

@Component({
  standalone: true,
  selector: 'app-facturas-list',
  imports: [CommonModule, FormsModule, FacturaFormComponent, PaginacionComponent],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4 gap-2">
        <h1 class="mb-0">
          <i class="fa-solid fa-file-invoice-dollar me-2"></i> Administración de Facturas
        </h1>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success" (click)="abrirEnOdoo()" title="Abrir Facturación Externa">
            <i class="fa-solid fa-arrow-up-right-from-square me-1"></i> Facturación Externa
          </button>
          <button class="btn btn-outline-primary" (click)="irANuevaFactura()">
            <i class="fa-solid fa-clipboard-list me-1"></i> Facturar un pedido
          </button>
          <button class="btn btn-primary" (click)="abrirFacturaSinPedido()">
            <i class="fa-solid fa-plus me-1"></i> Factura sin pedido
          </button>
        </div>
      </div>

      <!-- Filtros y búsqueda -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-12 col-md-5">
              <label class="form-label"><strong>Buscar por N° de orden o cliente</strong></label>
              <input
                type="text"
                class="form-control"
                placeholder="Ej: kJ2x9AbC o Juan Pérez"
                [(ngModel)]="busquedaPedidoId"
                (input)="filtrar()">
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label"><strong>Filtrar por Estado</strong></label>
              <select class="form-select" [(ngModel)]="filtroEstado" (change)="filtrar()">
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="procesada">Procesada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label"><strong>Origen</strong></label>
              <select class="form-select" [(ngModel)]="filtroOrigen" (change)="filtrar()">
                <option value="">Todas</option>
                <option value="pedido">Con pedido</option>
                <option value="sin-pedido">Sin pedido</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Facturas -->
      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-dark">
              <tr>
                <th>N° de orden</th>
                <th>Cliente</th>
                <th>Detalle del Pedido</th>
                <th>Valor Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let factura of facturasFiltradasMostradas$ | async; trackBy: trackByFactura">
                <td>
                  <strong *ngIf="factura.pedidoId">{{ factura.pedidoId }}</strong>
                  <span class="badge bg-secondary" *ngIf="!factura.pedidoId">Sin pedido</span>
                </td>
                <td>
                  <div class="mb-1">
                    {{ factura.datosCliente?.nombreCompleto }} {{ factura.datosCliente?.apellidos }}
                  </div>
                  <small class="text-muted">
                    {{ factura.datosCliente?.correoElectronico }}
                  </small>
                </td>
                <td>
                  <small class="text-muted" style="white-space: pre-line;">
                    {{ factura.detallePedido }}
                  </small>
                </td>
                <td>
                  <strong class="text-success">\${{ money(factura.valorTotal) }}</strong>
                </td>
                <td>
                  <span class="badge"
                    [class.bg-warning]="factura.estado === 'pendiente'"
                    [class.text-dark]="factura.estado === 'pendiente'"
                    [class.bg-success]="factura.estado === 'procesada'"
                    [class.bg-danger]="factura.estado === 'cancelada'">
                    {{ factura.estado }}
                  </span>
                </td>
                <td>
                  <small>
                    {{ factura.fechaCreacion | date: 'dd/MM/yyyy' }}
                  </small>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button
                      class="btn btn-outline-primary"
                      (click)="verDetalles(factura)"
                      title="Ver detalles">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                    <button
                      class="btn btn-outline-info"
                      (click)="cambiarEstado(factura, 'procesada')"
                      [disabled]="factura.estado === 'procesada' || factura.estado === 'cancelada'"
                      title="Marcar como procesada">
                      <i class="fa-solid fa-check"></i>
                    </button>
                    <button
                      class="btn btn-outline-danger"
                      (click)="solicitarCancelar(factura)"
                      [disabled]="factura.estado === 'cancelada'"
                      title="Cancelar">
                      <i class="fa-solid fa-ban"></i>
                    </button>
                    <button
                      class="btn btn-outline-secondary"
                      (click)="solicitarEliminar(factura)"
                      title="Eliminar factura">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card-footer text-muted" *ngIf="cargando">
          <p class="mb-0 text-center py-3">
            <span class="spinner-border spinner-border-sm me-2"></span> Cargando facturas...
          </p>
        </div>
        <div class="card-footer text-muted" *ngIf="!cargando && totalResultados === 0">
          <p class="mb-0 text-center py-3">
            <i class="fa-solid fa-inbox"></i> No hay facturas que coincidan con los filtros
          </p>
        </div>
        <app-paginacion
          *ngIf="!cargando"
          etiqueta="factura"
          [page]="page"
          [totalPages]="totalPages"
          [total]="totalResultados"
          [desde]="desdeResultado"
          [hasta]="hastaResultado"
          (pageChange)="setPage($event)">
        </app-paginacion>
      </div>

      <!-- Formulario de factura sin pedido -->
      <app-factura-form
        [visible]="mostrarFacturaSinPedido"
        [sinPedido]="true"
        [pedido]="null"
        [cliente]="null"
        (cerrarModal)="cerrarFacturaSinPedido()"
        (facturaCreada)="cerrarFacturaSinPedido()">
      </app-factura-form>

      <!-- Modal de detalles -->
      <div class="modal fade" [class.show]="mostrarModalDetalles" [style.display]="mostrarModalDetalles ? 'block' : 'none'" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="fa-solid fa-file-invoice-dollar me-2"></i> Detalles de Factura
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="mostrarModalDetalles = false"></button>
            </div>
            <div class="modal-body" *ngIf="facturaSeleccionada">
              <div class="row mb-3">
                <div class="col-md-6">
                  <h6 class="text-muted">N° de orden</h6>
                  <p class="mb-3">
                    <strong *ngIf="facturaSeleccionada.pedidoId">{{ facturaSeleccionada.pedidoId }}</strong>
                    <span class="badge bg-secondary" *ngIf="!facturaSeleccionada.pedidoId">Factura sin pedido asociado</span>
                  </p>
                </div>
                <div class="col-md-6">
                  <h6 class="text-muted">Estado</h6>
                  <p class="mb-3">
                    <span class="badge"
                      [class.bg-warning]="facturaSeleccionada.estado === 'pendiente'"
                      [class.text-dark]="facturaSeleccionada.estado === 'pendiente'"
                      [class.bg-success]="facturaSeleccionada.estado === 'procesada'"
                      [class.bg-danger]="facturaSeleccionada.estado === 'cancelada'">
                      {{ facturaSeleccionada.estado }}
                    </span>
                  </p>
                </div>
              </div>

              <div class="card mb-3">
                <div class="card-header bg-light">
                  <h6 class="mb-0"><i class="fa-solid fa-user me-2"></i>Datos del Cliente</h6>
                </div>
                <div class="card-body">
                  <p class="mb-2">
                    <strong>Nombre:</strong> {{ facturaSeleccionada.datosCliente?.nombreCompleto }}
                    {{ facturaSeleccionada.datosCliente?.apellidos }}
                  </p>
                  <p class="mb-2">
                    <strong>Dirección:</strong> {{ facturaSeleccionada.datosCliente?.direccion }}
                  </p>
                  <p class="mb-2">
                    <strong>Correo:</strong> {{ facturaSeleccionada.datosCliente?.correoElectronico }}
                  </p>
                  <p class="mb-2">
                    <strong>Teléfono:</strong> {{ facturaSeleccionada.datosCliente?.numeroCelular }}
                  </p>
                  <p class="mb-0">
                    <strong>Cédula/RUC:</strong> {{ facturaSeleccionada.datosCliente?.cedula }}
                  </p>
                </div>
              </div>

              <div class="card mb-3">
                <div class="card-header bg-light">
                  <h6 class="mb-0"><i class="fa-solid fa-clipboard-list me-2"></i>Detalle del Pedido</h6>
                </div>
                <div class="card-body">
                  <p class="text-muted mb-0" style="white-space: pre-line;">
                    {{ facturaSeleccionada.detallePedido }}
                  </p>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <p><strong>Valor Total:</strong></p>
                  <h5 class="text-success">\${{ money(facturaSeleccionada.valorTotal) }}</h5>
                </div>
                <div class="col-md-6">
                  <p><strong>Fecha de Creación:</strong></p>
                  <p>{{ facturaSeleccionada.fechaCreacion | date: 'dd/MM/yyyy HH:mm' }}</p>
                </div>
              </div>

              <div *ngIf="facturaSeleccionada.observaciones" class="card mt-3">
                <div class="card-header bg-light">
                  <h6 class="mb-0">Observaciones</h6>
                </div>
                <div class="card-body">
                  <p class="text-muted mb-0">{{ facturaSeleccionada.observaciones }}</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="mostrarModalDetalles = false">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="mostrarModalDetalles"></div>

      <!-- Modal confirmar eliminación -->
      <div class="modal fade" [class.show]="mostrarModalEliminar" [style.display]="mostrarModalEliminar ? 'block' : 'none'" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title"><i class="fa-solid fa-trash me-2"></i> Eliminar factura</h5>
              <button type="button" class="btn-close btn-close-white" (click)="cancelarEliminar()"></button>
            </div>
            <div class="modal-body" *ngIf="facturaEliminar">
              <p>¿Estás segura de que deseas eliminar esta factura<span *ngIf="facturaEliminar.pedidoId"> de la orden <strong>{{ facturaEliminar.pedidoId }}</strong></span>?</p>
              <p class="text-muted mb-0">Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cancelarEliminar()">Cancelar</button>
              <button type="button" class="btn btn-danger" (click)="confirmarEliminar()" [disabled]="eliminando">
                <span *ngIf="!eliminando"><i class="fa-solid fa-trash me-1"></i> Eliminar</span>
                <span *ngIf="eliminando"><span class="spinner-border spinner-border-sm me-2"></span> Eliminando...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="mostrarModalEliminar"></div>

      <!-- Modal confirmar cancelación -->
      <div class="modal fade" [class.show]="mostrarModalCancelar" [style.display]="mostrarModalCancelar ? 'block' : 'none'" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-warning">
              <h5 class="modal-title"><i class="fa-solid fa-ban me-2"></i> Cancelar factura</h5>
              <button type="button" class="btn-close" (click)="cerrarCancelar()"></button>
            </div>
            <div class="modal-body" *ngIf="facturaCancelar">
              <p>¿Estás segura de que deseas cancelar esta factura<span *ngIf="facturaCancelar.pedidoId"> de la orden <strong>{{ facturaCancelar.pedidoId }}</strong></span>?</p>
              <p class="text-muted mb-0">La factura quedará marcada como <strong>cancelada</strong> pero se conservará en el historial.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cerrarCancelar()">Volver</button>
              <button type="button" class="btn btn-warning" (click)="confirmarCancelar()" [disabled]="cancelando">
                <span *ngIf="!cancelando"><i class="fa-solid fa-ban me-1"></i> Cancelar factura</span>
                <span *ngIf="cancelando"><span class="spinner-border spinner-border-sm me-2"></span> Cancelando...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="mostrarModalCancelar"></div>
    </div>
  `,
})
export class FacturasListComponent implements OnInit {
  facturas$!: Observable<Factura[]>;
  facturasFiltradasMostradas$!: Observable<FacturaConDetalles[]>;
  busquedaPedidoId = '';
  filtroEstado = '';
  filtroOrigen = '';
  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalResultados = 0;
  cargando = true;
  desdeResultado = 0;
  hastaResultado = 0;
  mostrarFacturaSinPedido = false;
  mostrarModalDetalles = false;
  facturaSeleccionada: FacturaConDetalles | null = null;
  mostrarModalEliminar = false;
  facturaEliminar: FacturaConDetalles | null = null;
  eliminando = false;
  mostrarModalCancelar = false;
  facturaCancelar: FacturaConDetalles | null = null;
  cancelando = false;

  private busqueda$ = new BehaviorSubject<string>('');
  private filtro$ = new BehaviorSubject<string>('');
  private origen$ = new BehaviorSubject<string>('');
  private page$ = new BehaviorSubject<number>(1);

  constructor(
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private pedidosService: PedidosService,
    private router: Router,
    private zone: NgZone,
  ) {}

  ngOnInit() {
    this.facturas$ = this.facturasService.getFacturas();

    this.facturasFiltradasMostradas$ = combineLatest([
      this.facturas$,
      this.busqueda$,
      this.filtro$,
      this.origen$,
      this.page$,
    ]).pipe(
      map(([facturas, busqueda, filtro, origen, page]) => {
        const filtradas = facturas.filter((f) => {
          const haystack = `${f.pedidoId ?? ''} ${f.datosCliente?.nombreCompleto ?? ''} ${f.datosCliente?.apellidos ?? ''} ${f.datosCliente?.cedula ?? ''}`;
          const cumpleBusqueda = !busqueda || matchesSearch(haystack, busqueda);
          const cumpleFiltro = !filtro || f.estado === filtro;
          const cumpleOrigen =
            !origen ||
            (origen === 'sin-pedido' ? !f.pedidoId : !!f.pedidoId);
          return cumpleBusqueda && cumpleFiltro && cumpleOrigen;
        });

        // Más recientes primero, para que la paginación tenga un orden estable.
        filtradas.sort(
          (a, b) => (b.fechaCreacion?.getTime?.() ?? 0) - (a.fechaCreacion?.getTime?.() ?? 0),
        );

        const resultado = paginar(filtradas, page, this.pageSize);
        this.cargando = false;
        this.totalResultados = resultado.total;
        this.totalPages = resultado.totalPages;
        this.page = resultado.page;
        this.desdeResultado = resultado.desde;
        this.hastaResultado = resultado.hasta;
        if (resultado.page !== page) this.page$.next(resultado.page);
        return resultado.items;
      }),
      runInZone(this.zone),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  filtrar() {
    this.page = 1;
    this.page$.next(1);
    this.busqueda$.next(this.busquedaPedidoId);
    this.filtro$.next(this.filtroEstado);
    this.origen$.next(this.filtroOrigen);
  }

  setPage(page: number) {
    const paginaValida = Math.min(Math.max(page, 1), this.totalPages || 1);
    if (paginaValida === this.page) return;
    this.page = paginaValida;
    this.page$.next(paginaValida);
  }

  money(valor: number | null | undefined): string {
    return formatMoneda(valor);
  }

  trackByFactura(_index: number, factura: FacturaConDetalles): string {
    return factura.id;
  }

  verDetalles(factura: Factura) {
    this.facturaSeleccionada = factura as FacturaConDetalles;
    this.mostrarModalDetalles = true;
  }

  async cambiarEstado(factura: Factura, nuevoEstado: string) {
    try {
      await this.facturasService.updateFactura(factura.id, { estado: nuevoEstado as any });
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      alert('Error al actualizar la factura');
    }
  }

  solicitarCancelar(factura: FacturaConDetalles) {
    this.facturaCancelar = factura;
    this.mostrarModalCancelar = true;
  }

  cerrarCancelar() {
    this.mostrarModalCancelar = false;
    this.facturaCancelar = null;
  }

  async confirmarCancelar() {
    const factura = this.facturaCancelar;
    if (!factura) {
      this.cerrarCancelar();
      return;
    }
    this.cancelando = true;
    try {
      await this.facturasService.updateFactura(factura.id, { estado: 'cancelada' });
      this.cerrarCancelar();
    } catch (error) {
      console.error('Error al cancelar factura:', error);
      alert('Error al cancelar la factura');
    } finally {
      this.cancelando = false;
    }
  }

  solicitarEliminar(factura: FacturaConDetalles) {
    this.facturaEliminar = factura;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminar() {
    this.mostrarModalEliminar = false;
    this.facturaEliminar = null;
  }

  async confirmarEliminar() {
    const factura = this.facturaEliminar;
    if (!factura) {
      this.cancelarEliminar();
      return;
    }
    this.eliminando = true;
    try {
      await this.facturasService.deleteFactura(factura.id);
      this.cancelarEliminar();
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      alert('Error al eliminar la factura');
    } finally {
      this.eliminando = false;
    }
  }

  abrirEnOdoo() {
    const url = 'https://indumedin.kismasoft.com/web#action=203&model=account.move&view_type=form&cids=1&menu_id=117';
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  irANuevaFactura() {
    this.router.navigate(['/pedidos']);
  }

  abrirFacturaSinPedido() {
    this.mostrarFacturaSinPedido = true;
  }

  cerrarFacturaSinPedido() {
    this.mostrarFacturaSinPedido = false;
  }
}
