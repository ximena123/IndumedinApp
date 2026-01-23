import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { Observable, combineLatest } from 'rxjs'
import { map, startWith } from 'rxjs/operators'
import { Cliente } from '../models/cliente.model'
import { ResumenComponent } from '../resumen/resumen.component'
import { ClientesService } from './clientes.service'

@Component({
  standalone: true,
  selector: 'app-clientes-list',
  imports: [CommonModule, ReactiveFormsModule, ResumenComponent],
  template: `
    <div class="row">
      <div class="col-lg-10 col-md-12">
        <!-- CONTENIDO ORIGINAL DE CLIENTES -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2>Clientes</h2>
          <button class="btn btn-primary" (click)="nuevoCliente()">Nuevo cliente</button>
        </div>
        <div class="mb-3 row">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="Buscar por nombre" [formControl]="busquedaControl">
          </div>
        </div>
        <table class="table table-striped table-bordered">
          <thead class="table-dark">
            <tr>
              <th>Nombre</th>
              <th>Apellidos</th>
              <th>Teléfono</th>
              <th>Profesión</th>
              <th>Talla Camisa</th>
              <th>Talla Pantalón</th>
              <th>Especificaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cliente of clientesFiltrados$ | async">
              <td>{{cliente.nombreCompleto}}</td>
              <td>{{cliente.apellidos}}</td>
              <td>{{cliente.telefono}}</td>
              <td>{{cliente.profesion}}</td>
              <td>{{cliente.tallaCamisa}}</td>
              <td>{{cliente.tallaPantalon}}</td>
              <td>{{cliente.especificaciones}}</td>
              <td>
                <button class="btn btn-sm btn-warning" (click)="editarCliente(cliente.id)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="col-lg-2 d-none d-lg-block" style="padding-left:30px;">
        <app-resumen></app-resumen>
      </div>
    </div>
  `
})
export class ClientesListComponent {
  clientes$: Observable<Cliente[]> = this.clientesService.getClientes().pipe(
    map((clientes: any) => clientes ?? [])
  );
  busquedaControl = new FormControl('');
  clientesFiltrados$: Observable<Cliente[]> = combineLatest([
    this.clientes$,
    this.busquedaControl.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([clientes, filtro]) => {
      const lista = Array.isArray(clientes) ? clientes : [];
      const f = (filtro || '').toLowerCase();
      return lista.filter(c =>
        c.nombreCompleto.toLowerCase().includes(f) ||
        (c.apellidos?.toLowerCase().includes(f))
      );
    })
  );
  constructor(private clientesService: ClientesService, private router: Router) {}

  nuevoCliente() { this.router.navigate(['/clientes/nuevo']); }
  editarCliente(id: string) { this.router.navigate(['/clientes/editar', id]); }
}
