import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { BehaviorSubject, Observable, combineLatest, firstValueFrom } from 'rxjs'
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
        <!-- Modal normalizar -->
        <div class="modal fade" [class.show]="mostrarModalNormalizar" [style.display]="mostrarModalNormalizar ? 'block' : 'none'" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-warning">
                <h5 class="modal-title">Normalizar nombres</h5>
              </div>
              <div class="modal-body">
                <p class="mb-1">Se van a actualizar los nombres y apellidos de todos los clientes al formato <strong>Title Case</strong> (ejemplo: <em>juan PEREZ</em> → <em>Juan Perez</em>).</p>
                <p class="text-muted small mb-0">La operación es segura: solo afecta clientes cuyo nombre o apellido cambie con la normalización.</p>
                <div *ngIf="resultadoNormalizar" class="alert alert-info mt-3 mb-0">
                  {{ resultadoNormalizar }}
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="cerrarModalNormalizar()" [disabled]="normalizando">Cerrar</button>
                <button type="button" class="btn btn-warning" (click)="ejecutarNormalizacion()" [disabled]="normalizando">
                  <span *ngIf="normalizando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Normalizar ahora
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-backdrop fade show" *ngIf="mostrarModalNormalizar"></div>

        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h2 class="mb-0 fw-bold">Clientes</h2>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-warning" (click)="abrirModalNormalizar()" title="Normalizar nombres y apellidos">
              <i class="fa-solid fa-wand-magic-sparkles me-1"></i> Normalizar nombres
            </button>
            <button class="btn btn-primary" (click)="nuevoCliente()">
              <i class="fa-solid fa-plus me-1"></i> Nuevo cliente
            </button>
          </div>
        </div>
        <div class="mb-3">
          <div class="input-group" style="max-width: 400px;">
            <span class="input-group-text"><i class="fa-solid fa-search"></i></span>
            <input type="text" class="form-control" placeholder="Buscar por nombre o apellido..." [formControl]="busquedaControl">
          </div>
        </div>

        <!-- Vista mobile: cards -->
        <div class="d-block d-md-none">
          <div class="card mb-2 shadow-sm" *ngFor="let cliente of clientesFiltrados$ | async">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="fw-bold mb-1">{{cliente.nombreCompleto}} {{cliente.apellidos}}</h6>
                  <div class="text-muted small">
                    <i class="fa-solid fa-phone me-1"></i> {{cliente.telefono}}
                  </div>
                  <div class="text-muted small" *ngIf="cliente.profesion">
                    <i class="fa-solid fa-briefcase me-1"></i> {{cliente.profesion}}
                  </div>
                  <div class="mt-1 small" *ngIf="cliente.tallaCamisa || cliente.tallaPantalon">
                    <span class="badge bg-light text-dark me-1" *ngIf="cliente.tallaCamisa">Camisa: {{cliente.tallaCamisa}}</span>
                    <span class="badge bg-light text-dark" *ngIf="cliente.tallaPantalon">Pantalon: {{cliente.tallaPantalon}}</span>
                  </div>
                </div>
                <button class="btn btn-sm btn-outline-primary" (click)="editarCliente(cliente.id)">
                  <i class="fa-solid fa-pencil"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Vista desktop: tabla -->
        <div class="table-responsive d-none d-md-block">
          <table class="table table-hover align-middle mb-0 bg-white">
            <thead>
              <tr class="table-light">
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Telefono</th>
                <th>Profesion</th>
                <th class="text-center">Camisa</th>
                <th class="text-center">Pantalon</th>
                <th>Especificaciones</th>
                <th class="text-center" style="width: 80px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cliente of clientesFiltrados$ | async">
                <td class="fw-semibold">{{cliente.nombreCompleto}}</td>
                <td>{{cliente.apellidos}}</td>
                <td>{{cliente.telefono}}</td>
                <td>{{cliente.profesion}}</td>
                <td class="text-center">{{cliente.tallaCamisa}}</td>
                <td class="text-center">{{cliente.tallaPantalon}}</td>
                <td class="text-muted" style="max-width: 180px; font-size: 13px;">{{cliente.especificaciones}}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-primary" (click)="editarCliente(cliente.id)" title="Editar">
                    <i class="fa-solid fa-pencil"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <nav *ngIf="totalPages > 1" class="mt-3">
          <ul class="pagination justify-content-center flex-wrap">
            <li class="page-item" [class.disabled]="page === 1">
              <button class="page-link" (click)="setPage(page - 1)">&laquo;</button>
            </li>
            <ng-container *ngFor="let p of [].constructor(totalPages); let i = index">
              <li class="page-item" [class.active]="page === i + 1"
                *ngIf="i + 1 === 1 || i + 1 === totalPages || (i + 1 >= page - 1 && i + 1 <= page + 1)">
                <button class="page-link" (click)="setPage(i + 1)">{{ i + 1 }}</button>
              </li>
              <li class="page-item disabled" *ngIf="(i + 1 === page - 2 && page > 3) || (i + 1 === page + 2 && page < totalPages - 2)">
                <span class="page-link">...</span>
              </li>
            </ng-container>
            <li class="page-item" [class.disabled]="page === totalPages">
              <button class="page-link" (click)="setPage(page + 1)">&raquo;</button>
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
  mostrarModalNormalizar = false;
  normalizando = false;
  resultadoNormalizar = '';

  constructor(private clientesService: ClientesService, private router: Router) {}

  nuevoCliente() { this.router.navigate(['/clientes/nuevo']); }
  editarCliente(id: string) { this.router.navigate(['/clientes/editar', id]); }
  setPage(page: number) {
    const paginaValida = Math.min(Math.max(page, 1), this.totalPages || 1);
    this.page = paginaValida;
    this.page$.next(paginaValida);
  }

  abrirModalNormalizar(): void {
    this.resultadoNormalizar = '';
    this.mostrarModalNormalizar = true;
  }

  cerrarModalNormalizar(): void {
    this.mostrarModalNormalizar = false;
  }

  async ejecutarNormalizacion(): Promise<void> {
    if (this.normalizando) return;
    this.normalizando = true;
    this.resultadoNormalizar = '';
    try {
      const clientes = await firstValueFrom(this.clientesService.getClientes());
      const cambios: Array<{ id: string; nombreCompleto: string; apellidos: string }> = [];
      for (const c of clientes) {
        const nuevoNombre = this.toTitleCase(c.nombreCompleto ?? '');
        const nuevoApellidos = this.toTitleCase(c.apellidos ?? '');
        if (nuevoNombre !== (c.nombreCompleto ?? '') || nuevoApellidos !== (c.apellidos ?? '')) {
          cambios.push({ id: c.id, nombreCompleto: nuevoNombre, apellidos: nuevoApellidos });
        }
      }
      for (const cambio of cambios) {
        await this.clientesService.updateCliente(cambio.id, {
          nombreCompleto: cambio.nombreCompleto,
          apellidos: cambio.apellidos,
        });
      }
      this.resultadoNormalizar = `Listo. ${cambios.length} de ${clientes.length} clientes actualizados.`;
    } catch (e) {
      this.resultadoNormalizar = 'Ocurrió un error durante la normalización.';
    } finally {
      this.normalizando = false;
    }
  }

  private toTitleCase(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .map((w) => (w ? w.charAt(0).toLocaleUpperCase() + w.slice(1) : ''))
      .join(' ');
  }
}
