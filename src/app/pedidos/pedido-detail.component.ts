import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable, of } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { ClientesService } from '../clientes/clientes.service'
import { Cliente } from '../models/cliente.model'
import { Pedido } from '../models/pedido.model'
import { PedidoEmpresa } from '../models/pedido-empresa.model'
import { PedidosEmpresaService } from '../pedidos-empresa/pedidos-empresa.service'
import { PedidosService } from './pedidos.service'

@Component({
  standalone: true,
  selector: 'app-pedido-detail',
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="pedido$ | async as pedido">
      <ng-container *ngIf="empresa$ | async as empresa">
        <div class="alert alert-info py-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <i class="fa-solid fa-building me-1"></i>
            Empleado del pedido de empresa <strong>{{ empresa.nombreEmpresa }}</strong>
            — Responsable: {{ empresa.responsable }}
          </div>
          <button class="btn btn-sm btn-outline-primary" (click)="irAEmpresa(empresa.id)">
            <i class="fa-solid fa-arrow-up-right-from-square me-1"></i> Ver pedido de empresa
          </button>
        </div>
      </ng-container>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0 fw-bold">Detalle del Pedido</h2>
        <span class="badge rounded-pill fs-6"
          [class.bg-warning]="pedido.estado === 'pendiente'"
          [class.text-dark]="pedido.estado === 'pendiente'"
          [class.bg-primary]="pedido.estado === 'en_proceso'"
          [class.bg-info]="pedido.estado === 'terminado'"
          [class.bg-success]="pedido.estado === 'entregado'">
          {{ pedido.estado === 'en_proceso' ? 'En proceso' : pedido.estado }}
        </span>
      </div>
      <div class="row g-3">
        <div class="col-12 col-md-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-dark text-white"><i class="fa-solid fa-user me-2"></i>Cliente</div>
            <div class="card-body" *ngIf="cliente$ | async as cliente">
              <div class="mb-1"><strong>Nombre:</strong> {{ cliente.nombreCompleto }} {{ cliente.apellidos }}</div>
              <div class="mb-1"><strong>Teléfono:</strong> {{ cliente.telefono }}</div>
              <div class="mb-1"><strong>Profesión:</strong> {{ cliente.profesion }}</div>
              <hr class="my-2">
              <div class="small text-muted">
                <div>Camisa: {{ cliente.tallaCamisa }} | Pantalón: {{ cliente.tallaPantalon }} | Mandil: {{ cliente.tallaMandil }}</div>
                <div *ngIf="cliente.especificaciones" class="mt-1"><strong>Especificaciones:</strong> {{ cliente.especificaciones }}</div>
              </div>
            </div>
            <div *ngIf="!(cliente$ | async)" class="card-body text-muted">Cargando...</div>
          </div>
        </div>
        <div class="col-12 col-md-5">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-primary text-white"><i class="fa-solid fa-clipboard-list me-2"></i>Pedido</div>
            <div class="card-body">
              <div class="mb-2"><strong>Cantidad de ternos:</strong> {{ pedido.cantidadTernos || '-' }}</div>
              <div class="mb-2"><strong>Fecha de entrega:</strong> {{ pedido.fechaEntrega }}</div>
              <div><strong>Descripción:</strong></div>
              <p class="text-muted mb-2" style="white-space: pre-line;">{{ pedido.descripcion }}</p>
              <div class="border-top pt-2 mt-2">
                <div class="fw-semibold mb-1">
                  <i class="fa-solid fa-thread me-1"></i>Bordado
                  <span class="badge ms-1" [class.bg-success]="pedido.bordadoActivo !== false" [class.bg-secondary]="pedido.bordadoActivo === false">
                    {{ pedido.bordadoActivo === false ? 'Sin bordado' : 'Incluye bordado' }}
                  </span>
                </div>
                <ng-container *ngIf="pedido.bordadoActivo !== false">
                  <div class="small mb-1"><strong>Nombre:</strong> {{ pedido.bordadoNombre || '-' }}</div>
                  <div class="small mb-1"><strong>Profesión:</strong> {{ pedido.bordadoProfesion || '-' }}</div>
                  <div class="small mb-1"><strong>Logos:</strong> {{ pedido.bordadoLogos || '-' }}</div>
                  <div class="small"><strong>Personalizado:</strong> {{ pedido.bordadoPersonalizado || '-' }}</div>
                </ng-container>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-3">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-danger text-white"><i class="fa-solid fa-dollar-sign me-2"></i>Pago</div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <span>Precio:</span> <strong>\${{ pedido.precio || 0 }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Abono:</span> <strong class="text-success">\${{ pedido.abono || 0 }}</strong>
              </div>
              <hr class="my-2">
              <div class="d-flex justify-content-between">
                <span class="fw-bold">Saldo:</span>
                <strong class="fs-5" [class.text-danger]="pedido.saldo && pedido.saldo > 0">\${{ pedido.saldo || 0 }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Modal confirmar eliminación -->
      <div class="modal fade" [class.show]="mostrarModalEliminar" [style.display]="mostrarModalEliminar ? 'block' : 'none'" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">Eliminar pedido</h5>
            </div>
            <div class="modal-body">
              <p>¿Estás segura de que deseas eliminar este pedido?</p>
              <p class="text-muted mb-0">Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cancelarEliminar()">Cancelar</button>
              <button type="button" class="btn btn-danger" (click)="confirmarEliminar(pedido)">
                <i class="fa-solid fa-trash me-1"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="mostrarModalEliminar"></div>

      <div class="row g-2 mt-3">
        <div class="col-6 d-block d-md-none">
          <button class="btn btn-warning w-100" (click)="editarPedido(pedido)">
            <i class="fa-solid fa-pencil me-1"></i> Editar
          </button>
        </div>
        <div class="col-6 d-block d-md-none">
          <button class="btn btn-danger w-100" (click)="mostrarModalEliminar = true">
            <i class="fa-solid fa-trash me-1"></i> Eliminar
          </button>
        </div>
        <div class="col-6 d-block d-md-none" *ngIf="!pedido.pedidoEmpresaId && pedido.estado !== 'entregado'">
          <button class="btn btn-success w-100" (click)="marcarComoEntregado(pedido)">
            Entregado
          </button>
        </div>
        <div class="col-6 d-block d-md-none" *ngIf="!pedido.pedidoEmpresaId">
          <button class="btn btn-primary w-100"
            [disabled]="pedido.estado === 'en_proceso' || pedido.estado === 'terminado' || pedido.estado === 'entregado'"
            (click)="cambiarAEnProceso(pedido)">
            En Proceso
          </button>
        </div>
        <div class="col-12 d-block d-md-none">
          <button class="btn btn-secondary w-100" (click)="volver(pedido)">Volver</button>
        </div>
      </div>
      <div class="d-none d-md-flex gap-2 mt-3">
        <button class="btn btn-warning" (click)="editarPedido(pedido)">
          <i class="fa-solid fa-pencil me-1"></i> Editar
        </button>
        <button *ngIf="!pedido.pedidoEmpresaId" class="btn btn-primary"
          [disabled]="pedido.estado === 'en_proceso' || pedido.estado === 'terminado' || pedido.estado === 'entregado'"
          (click)="cambiarAEnProceso(pedido)">
          <i class="fa-solid fa-gear me-1"></i> En Proceso
        </button>
        <button *ngIf="!pedido.pedidoEmpresaId && pedido.estado !== 'entregado'" class="btn btn-success" (click)="marcarComoEntregado(pedido)">
          <i class="fa-solid fa-check me-1"></i> Entregado
        </button>
        <button class="btn btn-outline-danger" (click)="mostrarModalEliminar = true">
          <i class="fa-solid fa-trash me-1"></i> Eliminar
        </button>
        <button class="btn btn-outline-secondary ms-auto" (click)="volver(pedido)">
          <i class="fa-solid fa-arrow-left me-1"></i> Volver
        </button>
      </div>
    </ng-container>
  `,
})
export class PedidoDetailComponent {
  mostrarModalEliminar = false;
  pedidoId = this.route.snapshot.paramMap.get('id')!;
  pedido$: Observable<Pedido | undefined> = this.pedidosService
    .getPedidos()
    .pipe(map((pedidos) => pedidos.find((p) => p.id == this.pedidoId)));
  cliente$: Observable<Cliente | undefined> = this.pedido$.pipe(
    map((pedido) => pedido?.clienteId),
    // Usar switchMap para obtener el cliente como observable
    switchMap((clienteId) =>
      clienteId ? this.clientesService.getCliente(clienteId) : [undefined],
    ),
  );
  empresa$: Observable<PedidoEmpresa | undefined> = this.pedido$.pipe(
    switchMap((pedido) =>
      pedido?.pedidoEmpresaId
        ? this.pedidosEmpresaService.getPedidoEmpresa(pedido.pedidoEmpresaId)
        : of(undefined),
    ),
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidosService: PedidosService,
    private clientesService: ClientesService,
    private pedidosEmpresaService: PedidosEmpresaService,
  ) {}

  volver(pedido?: Pedido) {
    if (pedido?.pedidoEmpresaId) {
      this.router.navigate(['/pedidos-empresa', pedido.pedidoEmpresaId]);
    } else {
      this.router.navigate(['/pedidos']);
    }
  }
  editarPedido(pedido: Pedido) {
    if (pedido.pedidoEmpresaId) {
      this.router.navigate(['/pedidos/editar', pedido.id], {
        queryParams: { empresaId: pedido.pedidoEmpresaId },
      });
    } else {
      this.router.navigate(['/pedidos/editar', pedido.id]);
    }
  }
  cambiarAEnProceso(pedido: Pedido) {
    if (
      pedido.estado !== 'en_proceso' &&
      pedido.estado !== 'terminado' &&
      pedido.estado !== 'entregado'
    ) {
      this.pedidosService
        .updatePedido(pedido.id, { estado: 'en_proceso' })
        .then(() => {
          // Opcional: recargar o mostrar mensaje
        });
    }
  }
  marcarComoEntregado(pedido: Pedido) {
    if (pedido.estado !== 'entregado') {
      const precio = pedido.precio ?? 0;
      this.pedidosService.updatePedido(pedido.id, {
        estado: 'entregado',
        abono: precio,
        saldo: 0,
      });
    }
  }

  confirmarEliminar(pedido: Pedido) {
    this.pedidosService.deletePedido(pedido.id).then(() => {
      this.volver(pedido);
    });
    this.mostrarModalEliminar = false;
  }

  cancelarEliminar() {
    this.mostrarModalEliminar = false;
  }

  irAEmpresa(empresaId: string) {
    this.router.navigate(['/pedidos-empresa', empresaId]);
  }
}
