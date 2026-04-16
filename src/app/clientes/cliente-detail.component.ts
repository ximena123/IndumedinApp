import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MedidasService } from '../medidas/medidas.service'
import { PedidosService } from '../pedidos/pedidos.service'
import { ClientesService } from './clientes.service'

@Component({
  standalone: true,
  selector: 'app-cliente-detail',
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="cliente$ | async as cliente">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0 fw-bold">{{cliente.nombreCompleto}} {{cliente.apellidos}}</h2>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-12 col-md-6">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-dark text-white">
              <i class="fa-solid fa-user me-2"></i>Informacion del Cliente
            </div>
            <div class="card-body">
              <div class="mb-2"><i class="fa-solid fa-phone text-muted me-2"></i><strong>Telefono:</strong> {{cliente.telefono}}</div>
              <div class="mb-2"><i class="fa-solid fa-briefcase text-muted me-2"></i><strong>Profesion:</strong> {{cliente.profesion}}</div>
              <hr class="my-2">
              <div class="row text-center">
                <div class="col-4">
                  <div class="small text-muted">Camisa</div>
                  <div class="fw-bold">{{cliente.tallaCamisa || '-'}}</div>
                </div>
                <div class="col-4">
                  <div class="small text-muted">Pantalon</div>
                  <div class="fw-bold">{{cliente.tallaPantalon || '-'}}</div>
                </div>
                <div class="col-4">
                  <div class="small text-muted">Mandil</div>
                  <div class="fw-bold">{{cliente.tallaMandil || '-'}}</div>
                </div>
              </div>
              <div *ngIf="cliente.especificaciones" class="mt-2 small text-muted">
                <strong>Especificaciones:</strong> {{cliente.especificaciones}}
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-primary text-white">
              <i class="fa-solid fa-ruler me-2"></i>Medidas Actuales
            </div>
            <div class="card-body">
              <ng-container *ngIf="medidas$ | async as medidas">
                <div *ngIf="medidas.length; else noMedidas">
                  <div *ngFor="let m of medidas">
                    <div *ngIf="m.activo">
                      <div class="row g-2 text-center">
                        <div class="col-4 mb-2">
                          <div class="small text-muted">Busto</div>
                          <div class="fw-bold">{{m.busto}}</div>
                        </div>
                        <div class="col-4 mb-2">
                          <div class="small text-muted">Cintura</div>
                          <div class="fw-bold">{{m.cintura}}</div>
                        </div>
                        <div class="col-4 mb-2">
                          <div class="small text-muted">Cadera</div>
                          <div class="fw-bold">{{m.cadera}}</div>
                        </div>
                        <div class="col-4">
                          <div class="small text-muted">Hombro</div>
                          <div class="fw-bold">{{m.hombro}}</div>
                        </div>
                        <div class="col-4">
                          <div class="small text-muted">L. Manga</div>
                          <div class="fw-bold">{{m.largoManga}}</div>
                        </div>
                        <div class="col-4">
                          <div class="small text-muted">L. Pantalon</div>
                          <div class="fw-bold">{{m.largoPantalon}}</div>
                        </div>
                      </div>
                      <button class="btn btn-sm btn-outline-primary mt-2 w-100" (click)="editarMedidas(m.id)">
                        <i class="fa-solid fa-pencil me-1"></i> Editar medidas
                      </button>
                    </div>
                  </div>
                </div>
                <ng-template #noMedidas>
                  <div class="text-center py-3">
                    <p class="text-muted mb-2">Sin medidas registradas</p>
                    <button class="btn btn-primary btn-sm" (click)="crearMedidas()">
                      <i class="fa-solid fa-plus me-1"></i> Agregar medidas
                    </button>
                  </div>
                </ng-template>
              </ng-container>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold"><i class="fa-solid fa-clipboard-list me-2"></i>Historial de Pedidos</h5>
          <button class="btn btn-primary btn-sm" (click)="nuevoPedido()">
            <i class="fa-solid fa-plus me-1"></i> Nuevo pedido
          </button>
        </div>
        <div class="card-body p-0">
          <!-- Mobile cards -->
          <div class="d-block d-md-none p-3">
            <div class="card mb-2 border shadow-sm" *ngFor="let pedido of pedidos$ | async">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <div class="small text-muted text-truncate" style="max-width: 60%;">{{pedido.descripcion}}</div>
                  <span class="badge rounded-pill"
                    [class.bg-warning]="pedido.estado === 'pendiente'"
                    [class.text-dark]="pedido.estado === 'pendiente'"
                    [class.bg-primary]="pedido.estado === 'en_proceso'"
                    [class.bg-info]="pedido.estado === 'terminado'"
                    [class.bg-success]="pedido.estado === 'entregado'">
                    {{pedido.estado}}
                  </span>
                </div>
                <div class="small text-muted mb-2">
                  <i class="fa-regular fa-calendar me-1"></i> {{pedido.fechaEntrega | date}}
                </div>
                <button class="btn btn-sm btn-outline-primary w-100" (click)="verPedido(pedido.id)">
                  <i class="fa-regular fa-eye me-1"></i> Ver detalle
                </button>
              </div>
            </div>
          </div>
          <!-- Desktop table -->
          <div class="table-responsive d-none d-md-block">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr class="table-light">
                  <th>Descripcion</th>
                  <th class="text-center">Fecha creacion</th>
                  <th class="text-center">Fecha entrega</th>
                  <th class="text-center">Estado</th>
                  <th class="text-center" style="width: 80px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pedido of pedidos$ | async">
                  <td class="text-muted" style="max-width: 250px; font-size: 13px;">{{pedido.descripcion}}</td>
                  <td class="text-center text-nowrap">{{pedido.fechaCreacion | date}}</td>
                  <td class="text-center text-nowrap">{{pedido.fechaEntrega | date}}</td>
                  <td class="text-center">
                    <span class="badge rounded-pill"
                      [class.bg-warning]="pedido.estado === 'pendiente'"
                      [class.text-dark]="pedido.estado === 'pendiente'"
                      [class.bg-primary]="pedido.estado === 'en_proceso'"
                      [class.bg-info]="pedido.estado === 'terminado'"
                      [class.bg-success]="pedido.estado === 'entregado'">
                      {{ pedido.estado === 'en_proceso' ? 'En proceso' : pedido.estado }}
                    </span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" (click)="verPedido(pedido.id)">
                      <i class="fa-regular fa-eye"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <button class="btn btn-outline-secondary mt-3" (click)="volver()">
        <i class="fa-solid fa-arrow-left me-1"></i> Volver
      </button>
    </ng-container>
  `
})
export class ClienteDetailComponent {
  clienteId = this.route.snapshot.paramMap.get('id')!;
  cliente$ = this.clientesService.getCliente(this.clienteId);
  medidas$ = this.medidasService.getMedidasByCliente(this.clienteId);
  pedidos$ = this.pedidosService.getPedidosByCliente(this.clienteId);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private medidasService: MedidasService,
    private pedidosService: PedidosService
  ) {}

  editarMedidas(medidaId: string) { /* Navegar a formulario de edición de medidas */ }
  crearMedidas() { /* Navegar a formulario de creación de medidas */ }
  nuevoPedido() { this.router.navigate(['/pedidos/nuevo', this.clienteId]); }
  verPedido(pedidoId: string) { this.router.navigate(['/pedidos', pedidoId]); }
  volver() { this.router.navigate(['/clientes']); }
}
