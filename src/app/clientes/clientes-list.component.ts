import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { BehaviorSubject, Observable, combineLatest } from 'rxjs'
import { map, startWith, tap } from 'rxjs/operators'
import { Cliente } from '../models/cliente.model'
import { ResumenComponent } from '../resumen/resumen.component'
import { ClientesService } from './clientes.service'

@Component({
  standalone: true,
  selector: 'app-clientes-list',
  imports: [CommonModule, ReactiveFormsModule, ResumenComponent],
  template: `
    <div class="row">
      <div class="col-lg-8 col-md-12">
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
              <th class="d-none d-md-table-cell" >Profesión</th>
              <th class="d-none d-md-table-cell" >Talla Camisa</th>
              <th class="d-none d-md-table-cell">Talla Pantalón</th>
              <th class="d-none d-md-table-cell">Especificaciones</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cliente of clientesFiltrados$ | async">
              <td>{{cliente.nombreCompleto}}</td>
              <td>{{cliente.apellidos}}</td>
              <td>{{cliente.telefono}}</td>
              <td class="d-none d-md-table-cell">{{cliente.profesion}}</td>
              <td class="d-none d-md-table-cell">{{cliente.tallaCamisa}}</td>
              <td class="d-none d-md-table-cell">{{cliente.tallaPantalon}}</td>
              <td class="d-none d-md-table-cell">{{cliente.especificaciones}}</td>
              <td>
                <button class="btn btn-sm btn-warning" (click)="editarCliente(cliente.id)"><i class="fa-solid fa-pencil"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
        <nav *ngIf="totalPages > 1">
          <ul class="pagination justify-content-center">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" (click)="setPage(page - 1)">
                &laquo;
              </button>
            </li>
            <li
              class="page-item"
              *ngFor="let p of [].constructor(totalPages); let i = index"
              [class.active]="page === i + 1"
            >
              <button class="page-link" (click)="setPage(i + 1)">
                {{ i + 1 }}
              </button>
            </li>
            <li class="page-item" [class.disabled]="page === totalPages">
              <button class="page-link" (click)="setPage(page + 1)">
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
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
      const f = (filtro || '').toLowerCase();
      const filtrados = lista.filter(c =>
        c.nombreCompleto.toLowerCase().includes(f) ||
        (c.apellidos?.toLowerCase().includes(f))
      );
      this.totalPages = Math.max(1, Math.ceil(filtrados.length / this.pageSize));
      const paginaValida = Math.min(Math.max(page, 1), this.totalPages);
      if (paginaValida !== this.page) {
        this.page = paginaValida;
      }
      if (paginaValida !== page) {
        this.page$.next(paginaValida);
      }
      const start = (paginaValida - 1) * this.pageSize;
      return filtrados.slice(start, start + this.pageSize);
    })
  );
  constructor(private clientesService: ClientesService, private router: Router) {}

  nuevoCliente() { this.router.navigate(['/clientes/nuevo']); }
  editarCliente(id: string) { this.router.navigate(['/clientes/editar', id]); }
  setPage(page: number) {
    const paginaValida = Math.min(Math.max(page, 1), this.totalPages || 1);
    this.page = paginaValida;
    this.page$.next(paginaValida);
  }
}
