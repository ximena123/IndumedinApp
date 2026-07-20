import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs'
import { FacturasService } from './facturas.service'
import { Factura } from '../models/factura.model'
import { ClientesService } from '../clientes/clientes.service'
import { PedidosService } from '../pedidos/pedidos.service'
import { Cliente } from '../models/cliente.model'
import { Pedido } from '../models/pedido.model'

interface FacturaConDetalles extends Factura {
  cliente?: Cliente;
  pedido?: Pedido;
}

@Component({
  standalone: true,
  selector: 'app-facturas-list',
  imports: [CommonModule, FormsModule],
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
          <button class="btn btn-primary" (click)="irANuevaFactura()">
            <i class="fa-solid fa-plus me-1"></i> Nueva Factura
          </button>
        </div>
      </div>

      <!-- Filtros y búsqueda -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label"><strong>Buscar por ID de Pedido</strong></label>
              <input
                type="text"
                class="form-control"
                placeholder="Ej: pedido123"
                [(ngModel)]="busquedaPedidoId"
                (input)="filtrar()">
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label"><strong>Filtrar por Estado</strong></label>
              <select class="form-select" [(ngModel)]="filtroEstado" (change)="filtrar()">
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="procesada">Procesada</option>
                <option value="cancelada">Cancelada</option>
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
                <th>ID Pedido</th>
                <th>Cliente</th>
                <th>Detalle del Pedido</th>
                <th>Valor Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let factura of facturasFiltradasMostradas$ | async">
                <td>
                  <strong>{{ factura.pedidoId }}</strong>
                </td>
                <td>
                  <div class="mb-1">
                    {{ factura.datosCliente.nombreCompleto }} {{ factura.datosCliente.apellidos }}
                  </div>
                  <small class="text-muted">
                    {{ factura.datosCliente.correoElectronico }}
                  </small>
                </td>
                <td>
                  <small class="text-muted" style="white-space: pre-line;">
                    {{ factura.detallePedido }}
                  </small>
                </td>
                <td>
                  <strong class="text-success">\${{ factura.valorTotal }}</strong>
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
                      (click)="cancelarFactura(factura)"
                      [disabled]="factura.estado === 'cancelada'"
                      title="Cancelar">
                      <i class="fa-solid fa-ban"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card-footer text-muted" *ngIf="(facturasFiltradasMostradas$ | async)?.length === 0">
          <p class="mb-0 text-center py-3">
            <i class="fa-solid fa-inbox"></i> No hay facturas que coincidan con los filtros
          </p>
        </div>
      </div>

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
                  <h6 class="text-muted">ID de Pedido</h6>
                  <p class="mb-3"><strong>{{ facturaSeleccionada.pedidoId }}</strong></p>
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
                    <strong>Nombre:</strong> {{ facturaSeleccionada.datosCliente.nombreCompleto }}
                    {{ facturaSeleccionada.datosCliente.apellidos }}
                  </p>
                  <p class="mb-2">
                    <strong>Dirección:</strong> {{ facturaSeleccionada.datosCliente.direccion }}
                  </p>
                  <p class="mb-2">
                    <strong>Correo:</strong> {{ facturaSeleccionada.datosCliente.correoElectronico }}
                  </p>
                  <p class="mb-2">
                    <strong>Teléfono:</strong> {{ facturaSeleccionada.datosCliente.numeroCelular }}
                  </p>
                  <p class="mb-0">
                    <strong>Cédula/RUC:</strong> {{ facturaSeleccionada.datosCliente.cedula }}
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
                  <h5 class="text-success">\${{ facturaSeleccionada.valorTotal }}</h5>
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
    </div>
  `,
})
export class FacturasListComponent implements OnInit {
  facturas$!: Observable<Factura[]>;
  facturasFiltradasMostradas$!: Observable<FacturaConDetalles[]>;
  busquedaPedidoId = '';
  filtroEstado = '';
  mostrarModalDetalles = false;
  facturaSeleccionada: FacturaConDetalles | null = null;

  private busqueda$ = new BehaviorSubject<string>('');
  private filtro$ = new BehaviorSubject<string>('');

  constructor(
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private pedidosService: PedidosService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.facturas$ = this.facturasService.getFacturas();

    this.facturasFiltradasMostradas$ = combineLatest([
      this.facturas$,
      this.busqueda$,
      this.filtro$,
    ]).pipe(
      map(([facturas, busqueda, filtro]) => {
        return facturas.filter((f) => {
          const cumpleBusqueda = !busqueda || f.pedidoId.toLowerCase().includes(busqueda.toLowerCase());
          const cumpleFiltro = !filtro || f.estado === filtro;
          return cumpleBusqueda && cumpleFiltro;
        });
      }),
    );
  }

  filtrar() {
    this.busqueda$.next(this.busquedaPedidoId);
    this.filtro$.next(this.filtroEstado);
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

  async cancelarFactura(factura: Factura) {
    if (confirm('¿Está segura de que desea cancelar esta factura?')) {
      try {
        await this.facturasService.updateFactura(factura.id, { estado: 'cancelada' });
      } catch (error) {
        console.error('Error al cancelar factura:', error);
      }
    }
  }

  abrirEnOdoo() {
    const url = 'https://indumedin.kismasoft.com/web#action=203&model=account.move&view_type=form&cids=1&menu_id=117';
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  irANuevaFactura() {
    this.router.navigate(['/pedidos']);
  }
}
