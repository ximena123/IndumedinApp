import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable, combineLatest, firstValueFrom, of } from 'rxjs'
import { map, shareReplay, switchMap } from 'rxjs/operators'
import { ClientesService } from '../clientes/clientes.service'
import { Cliente } from '../models/cliente.model'
import { Pedido } from '../models/pedido.model'
import { EstadoPedidoEmpresa, PedidoEmpresa } from '../models/pedido-empresa.model'
import { PedidosService } from '../pedidos/pedidos.service'
import { PedidosEmpresaService } from './pedidos-empresa.service'

interface EmpleadoFila {
  pedido: Pedido;
  cliente?: Cliente;
}

@Component({
  standalone: true,
  selector: 'app-pedido-empresa-detail',
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="pedidoEmpresa$ | async as pe">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 class="mb-0 fw-bold">{{ pe.nombreEmpresa }}</h2>
        <span class="badge rounded-pill fs-6"
          [class.bg-warning]="pe.estado === 'pendiente'"
          [class.text-dark]="pe.estado === 'pendiente'"
          [class.bg-primary]="pe.estado === 'en_proceso'"
          [class.bg-info]="pe.estado === 'terminado'"
          [class.bg-success]="pe.estado === 'entregado'">
          {{ pe.estado === 'en_proceso' ? 'En proceso' : pe.estado }}
        </span>
      </div>

      <div class="row g-3">
        <div class="col-12 col-md-5">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-dark text-white">
              <i class="fa-solid fa-building me-2"></i>Empresa
            </div>
            <div class="card-body">
              <div class="mb-1"><strong>Responsable:</strong> {{ pe.responsable }}</div>
              <div class="mb-1"><strong>Teléfono:</strong> {{ pe.telefonoResponsable }}</div>
              <div class="mb-1"><strong>Fecha de entrega:</strong> {{ pe.fechaEntrega }}</div>
              <hr class="my-2">
              <div><strong>Descripción:</strong></div>
              <p class="text-muted mb-0" style="white-space: pre-line;">{{ pe.descripcion }}</p>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-primary text-white">
              <i class="fa-solid fa-users me-2"></i>Resumen
            </div>
            <div class="card-body" *ngIf="resumen$ | async as r">
              <div class="d-flex justify-content-between mb-2">
                <span>Empleados:</span> <strong>{{ r.numeroEmpleados }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Total ternos:</span> <strong>{{ r.totalTernos }}</strong>
              </div>
              <hr class="my-2">
              <div class="d-flex justify-content-between mb-2">
                <span>Valor total:</span> <strong>\${{ r.valorTotal }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Total abonado:</span> <strong class="text-success">\${{ r.totalAbonado }}</strong>
              </div>
              <hr class="my-2">
              <div class="d-flex justify-content-between">
                <span class="fw-bold">Saldo pendiente:</span>
                <strong class="fs-5" [class.text-danger]="r.saldoPendiente > 0">\${{ r.saldoPendiente }}</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-3">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-secondary text-white">
              <i class="fa-solid fa-gear me-2"></i>Acciones
            </div>
            <div class="card-body d-flex flex-column gap-2">
              <button class="btn btn-success" (click)="agregarEmpleado(pe.id)">
                <i class="fa-solid fa-user-plus me-1"></i> Agregar empleado
              </button>
              <button class="btn btn-warning" (click)="editar(pe.id)">
                <i class="fa-solid fa-pencil me-1"></i> Editar empresa
              </button>
              <button
                class="btn btn-primary"
                [disabled]="pe.estado === 'en_proceso' || pe.estado === 'terminado' || pe.estado === 'entregado'"
                (click)="cambiarEstado(pe, 'en_proceso')">
                <i class="fa-solid fa-gear me-1"></i> En proceso
              </button>
              <button
                *ngIf="pe.estado !== 'entregado'"
                class="btn btn-success"
                (click)="cambiarEstado(pe, 'entregado')">
                <i class="fa-solid fa-check me-1"></i> Marcar entregado
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mt-4">
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <strong><i class="fa-solid fa-list me-2"></i>Empleados</strong>
          <button class="btn btn-sm btn-success" (click)="agregarEmpleado(pe.id)">
            <i class="fa-solid fa-plus me-1"></i> Agregar
          </button>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr class="table-light">
                <th>Empleado</th>
                <th class="text-center">Ternos</th>
                <th>Descripción</th>
                <th class="text-end">Precio</th>
                <th class="text-end">Abono</th>
                <th class="text-end">Saldo</th>
                <th class="text-center" style="width: 160px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let fila of empleados$ | async">
                <td class="fw-semibold">
                  {{ fila.cliente ? (fila.cliente.nombreCompleto + ' ' + fila.cliente.apellidos) : fila.pedido.clienteId }}
                </td>
                <td class="text-center">{{ fila.pedido.cantidadTernos || '-' }}</td>
                <td class="text-muted" style="font-size: 13px; max-width: 220px;">
                  {{ fila.pedido.descripcion.length > 80 ? (fila.pedido.descripcion | slice: 0 : 80) + '...' : fila.pedido.descripcion }}
                </td>
                <td class="text-end">\${{ fila.pedido.precio || 0 }}</td>
                <td class="text-end">\${{ fila.pedido.abono || 0 }}</td>
                <td class="text-end fw-bold" [class.text-danger]="fila.pedido.saldo && fila.pedido.saldo > 0">
                  \${{ fila.pedido.saldo || 0 }}
                </td>
                <td class="text-center">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" (click)="verEmpleado(fila.pedido.id)" title="Ver detalle">
                      <i class="fa-regular fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-primary" (click)="editarEmpleado(fila.pedido.id, pe.id)" title="Editar">
                      <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" (click)="eliminarEmpleado(fila.pedido.id)" title="Eliminar">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="(empleados$ | async)?.length === 0">
                <td colspan="7" class="text-center text-muted py-4">Aún no hay empleados en este pedido.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-outline-secondary ms-auto" (click)="volver()">
          <i class="fa-solid fa-arrow-left me-1"></i> Volver
        </button>
      </div>
    </ng-container>
  `,
})
export class PedidoEmpresaDetailComponent {
  private pedidoEmpresaId = this.route.snapshot.paramMap.get('id') ?? '';

  pedidoEmpresa$: Observable<PedidoEmpresa | undefined> = this.pedidosEmpresaService
    .getPedidoEmpresa(this.pedidoEmpresaId)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  private pedidos$: Observable<Pedido[]> = this.pedidosService
    .getPedidosByEmpresa(this.pedidoEmpresaId)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  empleados$: Observable<EmpleadoFila[]> = this.pedidos$.pipe(
    switchMap((pedidos) => {
      if (pedidos.length === 0) return of<EmpleadoFila[]>([]);
      const filas$ = pedidos.map((pedido) =>
        this.clientesService.getCliente(pedido.clienteId).pipe(
          map((cliente) => ({ pedido, cliente })),
        ),
      );
      return combineLatest(filas$);
    }),
  );

  resumen$ = this.pedidos$.pipe(
    map((pedidos) => {
      const valorTotal = pedidos.reduce((acc, p) => acc + (p.precio || 0), 0);
      const totalAbonado = pedidos.reduce((acc, p) => acc + (p.abono || 0), 0);
      const totalTernos = pedidos.reduce((acc, p) => acc + (p.cantidadTernos || 0), 0);
      return {
        numeroEmpleados: pedidos.length,
        totalTernos,
        valorTotal,
        totalAbonado,
        saldoPendiente: valorTotal - totalAbonado,
      };
    }),
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidosEmpresaService: PedidosEmpresaService,
    private pedidosService: PedidosService,
    private clientesService: ClientesService,
  ) {}

  volver(): void {
    this.router.navigate(['/pedidos-empresa']);
  }

  editar(id: string): void {
    this.router.navigate(['/pedidos-empresa/editar', id]);
  }

  agregarEmpleado(empresaId: string): void {
    this.router.navigate(['/pedidos/nuevo'], { queryParams: { empresaId } });
  }

  editarEmpleado(pedidoId: string, empresaId: string): void {
    this.router.navigate(['/pedidos/editar', pedidoId], { queryParams: { empresaId } });
  }

  verEmpleado(pedidoId: string): void {
    this.router.navigate(['/pedidos', pedidoId]);
  }

  async cambiarEstado(pe: PedidoEmpresa, estado: EstadoPedidoEmpresa): Promise<void> {
    if (pe.estado === estado) return;
    await this.pedidosEmpresaService.updatePedidoEmpresa(pe.id, { estado });
    const pedidos = await firstValueFrom(this.pedidosService.getPedidosByEmpresa(pe.id));
    await Promise.all(
      pedidos.map((p) => {
        const cambios: Partial<Pedido> = { estado };
        if (estado === 'entregado') {
          cambios.abono = p.precio ?? 0;
          cambios.saldo = 0;
        }
        return this.pedidosService.updatePedido(p.id, cambios);
      }),
    );
  }

  async eliminarEmpleado(pedidoId: string): Promise<void> {
    await this.pedidosService.deletePedido(pedidoId);
  }
}
