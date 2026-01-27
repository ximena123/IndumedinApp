import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { ClientesService } from '../clientes/clientes.service'
import { Cliente } from '../models/cliente.model'
import { Pedido } from '../models/pedido.model'
import { PedidosService } from './pedidos.service'

@Component({
  standalone: true,
  selector: 'app-pedido-detail',
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="pedido$ | async as pedido">
      <h2 class="mb-3">Detalle del Pedido</h2>
      <div class="row g-2">
        <div class="col-12 col-md-6">
          <div class="card mb-3 h-100">
            <div class="card-header bg-dark text-white">Datos del Cliente</div>
            <div class="card-body" *ngIf="cliente$ | async as cliente">
              <div><strong>Nombre:</strong> {{ cliente.nombreCompleto }}</div>
              <div><strong>Apellidos:</strong> {{ cliente.apellidos }}</div>
              <div><strong>Teléfono:</strong> {{ cliente.telefono }}</div>
              <div><strong>Profesión:</strong> {{ cliente.profesion }}</div>
              <div>
                <strong>Talla Camisa:</strong> {{ cliente.tallaCamisa }}
              </div>
              <div>
                <strong>Talla Pantalón:</strong> {{ cliente.tallaPantalon }}
              </div>
              <div>
                <strong>Talla Mandil:</strong> {{ cliente.tallaMandil }}
              </div>
              <div>
                <strong>Especificaciones:</strong>
                {{ cliente.especificaciones }}
              </div>
            </div>
            <div *ngIf="!(cliente$ | async)">Cargando datos del cliente...</div>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div class="card mb-3 h-100">
            <div class="card-header bg-primary text-white">
              Datos del Pedido
            </div>
            <div class="card-body">
              <div>
                <strong>Cantidad de ternos:</strong>
                {{ pedido.cantidadTernos || '-' }}
              </div>
              <div><strong>Descripción:</strong> {{ pedido.descripcion }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="d-flex flex-column flex-md-row gap-2 mt-3">
        <button
          class="btn btn-info btn-sm w-100 w-md-auto d-block d-md-none"
          (click)="editarPedido(pedido.id)"
        >
          <i class="fa-solid fa-pencil"></i>
        </button>
        <button class="btn btn-secondary w-100 w-md-auto" (click)="volver()">
          Volver
        </button>
        <button
          class="btn btn-primary w-100 w-md-auto"
          [disabled]="
            pedido.estado === 'en_proceso' ||
            pedido.estado === 'terminado' ||
            pedido.estado === 'entregado'
          "
          (click)="cambiarAEnProceso(pedido)"
        >
          Marcar como En Proceso
        </button>
      </div>
    </ng-container>
  `,
})
export class PedidoDetailComponent {
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidosService: PedidosService,
    private clientesService: ClientesService,
  ) {}

  volver() {
    this.router.navigate(['/pedidos']);
  }
  editarPedido(id: string) {
    this.router.navigate(['/pedidos/editar', id]);
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
}
