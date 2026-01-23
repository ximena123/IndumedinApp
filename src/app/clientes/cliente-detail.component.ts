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
      <h2>{{cliente.nombreCompleto}} {{cliente.apellidos}}</h2>
      <div class="mb-3">
        <strong>Teléfono:</strong> {{cliente.telefono}}<br>
        <strong>Profesión:</strong> {{cliente.profesion}}<br>
        <strong>Talla de camisa:</strong> {{cliente.tallaCamisa}}<br>
        <strong>Talla de pantalón:</strong> {{cliente.tallaPantalon}}<br>
        <strong>Especificaciones:</strong> {{cliente.especificaciones}}
      </div>
      <h3>Medidas actuales</h3>
      <ng-container *ngIf="medidas$ | async as medidas">
        <div *ngIf="medidas.length; else noMedidas">
          <div *ngFor="let m of medidas">
            <div *ngIf="m.activo">
              <div>Busto: {{m.busto}}</div>
              <div>Cintura: {{m.cintura}}</div>
              <div>Cadera: {{m.cadera}}</div>
              <div>Hombro: {{m.hombro}}</div>
              <div>Largo Manga: {{m.largoManga}}</div>
              <div>Largo Pantalón: {{m.largoPantalon}}</div>
              <button (click)="editarMedidas(m.id)">Editar medidas</button>
            </div>
          </div>
        </div>
        <ng-template #noMedidas>
          <button (click)="crearMedidas()">Agregar medidas</button>
        </ng-template>
      </ng-container>
      <h3>Historial de pedidos</h3>
      <table>
        <tr>
          <th>Descripción</th>
          <th>Fecha creación</th>
          <th>Fecha entrega</th>
          <th>Estado</th>
        </tr>
        <tr *ngFor="let pedido of pedidos$ | async">
          <td>{{pedido.descripcion}}</td>
          <td>{{pedido.fechaCreacion | date}}</td>
          <td>{{pedido.fechaEntrega | date}}</td>
          <td>{{pedido.estado}}</td>
          <td><button (click)="verPedido(pedido.id)">Ver</button></td>
        </tr>
      </table>
      <button (click)="nuevoPedido()">Nuevo pedido</button>
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
  verPedido(pedidoId: string) { /* Navegar a detalle de pedido */ }
}
