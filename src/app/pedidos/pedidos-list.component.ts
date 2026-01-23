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
    <div class="row">
      <div class="col-lg-10 col-md-12">
        <!-- CONTENIDO ORIGINAL DE PEDIDOS -->
        <div class="container mt-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Pedidos</h2>
            <button class="btn btn-primary" (click)="nuevoPedido()">Nuevo pedido</button>
          </div>
          <div class="mb-3 row">
            <div class="col-md-6">
              <input type="text" class="form-control" placeholder="Buscar cliente" [(ngModel)]="busquedaCliente" (input)="onClienteSearch(busquedaCliente)">
            </div>
            <div class="col-md-3">
              <input type="date" class="form-control" [(ngModel)]="busquedaFecha" (change)="onFechaEntrega(busquedaFecha)">
            </div>
            <div class="col-md-3">
              <button class="btn btn-outline-secondary" (click)="borrarFiltros()">Borrar filtro</button>
            </div>
          </div>
          <table class="table table-striped table-bordered">
            <thead class="table-dark">
              <tr>
                <th class="text-center">Cliente</th>
                <th class="text-center">Fecha de entrega</th>
                <th class="text-center">Estado</th>
                <th class="text-center">Descripción</th>
                <th class="text-center">Precio</th>
                <th class="text-center">Abono</th>
                <th class="text-center">Saldo</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pedido of pedidosFiltrados$ | async">
                <td>{{ getClienteNombre(pedido.clienteId) }}</td>
                <td class="text-center">{{ getFechaEntrega(pedido.fechaEntrega) | date:'shortDate' }}</td>
                <td class="text-center">{{ pedido.estado }}</td>
                <td>{{ pedido.descripcion }}</td>
                <td>{{ pedido.precio }}</td>
                <td>{{ pedido.abono }}</td>
                <td>{{ pedido.saldo }}</td>
                <td class="text-center">
                  <button class="btn btn-warning btn-sm" (click)="verDetalle(pedido.id)">Ver mas</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="col-lg-2 d-none d-lg-block" style="padding-left:30px;">
        <app-resumen></app-resumen>
      </div>
    </div>
  `,
})
export class PedidosListComponent {
          busquedaCliente = '';
          busquedaFecha = '';

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
      getFechaEntrega(fecha: any): Date | null {
        if (!fecha) return null;
        if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
          // Mostrar como Date solo para el pipe
          const [y, m, d] = fecha.split('-');
          return new Date(Number(y), Number(m) - 1, Number(d));
        }
        return null;
      }
    getInputValue(event: Event): string {
      const target = event.target as HTMLInputElement;
      return target?.value ?? '';
    }
  pedidos$ = this.pedidosService.getPedidos();
  clienteSearch$ = new BehaviorSubject<string>('');
  fechaEntrega$ = new BehaviorSubject<string>('');

  pedidosFiltrados$: Observable<Pedido[]> = combineLatest([
    this.pedidos$,
    this.clienteSearch$,
    this.fechaEntrega$
  ]).pipe(
    map(([pedidos, clienteSearch, fechaEntrega]) =>
      pedidos.filter(p => {
        const nombreCoincide = !clienteSearch || this.getClienteNombre(p.clienteId).toLowerCase().includes(clienteSearch.toLowerCase());
        if (!fechaEntrega) return nombreCoincide;
        // Convertir fechaEntrega del pedido a string yyyy-MM-dd si es Date
        let pedidoFechaStr = '';
        if (p.fechaEntrega instanceof Date) {
          pedidoFechaStr = this.formatDateYMD(p.fechaEntrega);
        } else if (typeof p.fechaEntrega === 'string') {
          pedidoFechaStr = p.fechaEntrega;
        }
        return nombreCoincide && pedidoFechaStr === fechaEntrega;
      })
    )
  );
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
    this.clienteSearch$.next(value);
  }
  onFechaEntrega(value: string) {
    console.log('Valor recibido en filtro de fecha:', value);
    this.fechaEntrega$.next(value);
  }
}
