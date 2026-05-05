import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Cliente } from '../models/cliente.model'
import { normalizeSearch } from '../shared/search.util'
import { ClientesService } from './clientes.service'

@Component({
  standalone: true,
  selector: 'app-cliente-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2 class="fw-bold mb-3">{{ esEdicion ? 'Editar' : 'Nuevo' }} Cliente</h2>
    <div *ngIf="loading" class="d-flex justify-content-center align-items-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
    <div *ngIf="!loading" class="card shadow-sm border-0" style="max-width: 800px;">
      <div class="card-body p-4">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="row g-3" novalidate>
          <div class="col-md-6">
            <label class="form-label">Nombre(s) <span class="text-danger">*</span></label>
            <input formControlName="nombreCompleto" class="form-control" placeholder="Nombre(s)" [class.is-invalid]="hasError('nombreCompleto')" />
            <div class="invalid-feedback" *ngIf="hasError('nombreCompleto')">El nombre es requerido.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Apellidos <span class="text-danger">*</span></label>
            <input formControlName="apellidos" class="form-control" placeholder="Apellidos" [class.is-invalid]="hasError('apellidos')" />
            <div class="invalid-feedback" *ngIf="hasError('apellidos')">Los apellidos son requeridos.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Telefono <span class="text-danger">*</span></label>
            <div class="input-group" [class.has-validation]="hasError('telefono')">
              <span class="input-group-text"><i class="fa-solid fa-phone"></i></span>
              <input formControlName="telefono" class="form-control" placeholder="Telefono" [class.is-invalid]="hasError('telefono')" />
              <div class="invalid-feedback" *ngIf="hasError('telefono')">El teléfono es requerido.</div>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Profesion</label>
            <input formControlName="profesion" class="form-control" placeholder="Profesion" />
          </div>
          <hr class="my-2">
          <div class="col-md-4">
            <label class="form-label">Talla Camisa <span class="text-danger">*</span></label>
            <input formControlName="tallaCamisa" class="form-control" placeholder="Ej: M, L, XL" [class.is-invalid]="hasError('tallaCamisa')" />
            <div class="invalid-feedback" *ngIf="hasError('tallaCamisa')">La talla de camisa es requerida.</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Talla Pantalon <span class="text-danger">*</span></label>
            <input formControlName="tallaPantalon" class="form-control" placeholder="Ej: 32, 34" [class.is-invalid]="hasError('tallaPantalon')" />
            <div class="invalid-feedback" *ngIf="hasError('tallaPantalon')">La talla de pantalón es requerida.</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Talla Mandil</label>
            <input formControlName="tallaMandil" class="form-control" placeholder="Ej: M, L" />
          </div>
          <div class="col-12">
            <label class="form-label">Especificaciones</label>
            <textarea formControlName="especificaciones" class="form-control" placeholder="Notas adicionales sobre el cliente..." rows="3"></textarea>
          </div>
          <div *ngIf="submitted && form.invalid" class="alert alert-warning col-12 mb-0">
            <i class="fa-solid fa-triangle-exclamation me-1"></i>
            Por favor completa los campos requeridos marcados en rojo.
          </div>
          <div *ngIf="duplicado" class="alert alert-danger col-12 mb-0">
            <i class="fa-solid fa-triangle-exclamation me-1"></i>
            Ya existe un cliente con estos datos: <strong>{{ duplicado }}</strong>. No se puede registrar dos veces.
          </div>
          <div *ngIf="error" class="alert alert-danger col-12 mb-0">{{ error }}</div>
          <div class="col-12 d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-outline-secondary px-4" (click)="router.navigate(['/clientes'])" [disabled]="loading || guardando">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success px-4" [disabled]="loading || guardando || !!duplicado">
              <span *ngIf="guardando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ClienteFormComponent implements OnInit {
  clienteId?: string;
  esEdicion = false;
  guardando = false;
  submitted = false;
  empresaId?: string;
  form = this.fb.group({
    nombreCompleto: ['', Validators.required],
    apellidos: ['', Validators.required],
    telefono: ['', Validators.required],
    profesion: [''],
    tallaCamisa: ['', Validators.required],
    tallaPantalon: ['', Validators.required],
    tallaMandil: [''],
    especificaciones: [''],
  });
  loading = false;
  error: string | null = null;
  duplicado: string | null = null;
  private clientesExistentes: Cliente[] = [];

  constructor(
    private fb: FormBuilder,
    private clientesService: ClientesService,
    public router: Router,
    private route: ActivatedRoute,
  ) {
    // Detectar si es edición por la URL
    const url = this.router.url;
    if (url.includes('/editar/')) {
      const partes = url.split('/');
      this.clienteId = partes[partes.length - 1].split('?')[0];
      this.esEdicion = true;
    }
    const empresaIdParam = this.route.snapshot.queryParamMap.get('empresaId');
    if (empresaIdParam) {
      this.empresaId = empresaIdParam;
    }
  }

  ngOnInit() {
    if (this.esEdicion && this.clienteId) {
      this.loading = true;
      this.clientesService.getCliente(this.clienteId).subscribe({
        next: (cliente) => {
          this.form.patchValue(cliente);
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudo cargar el cliente';
          this.loading = false;
        },
      });
    }

    this.clientesService.getClientes().subscribe((clientes) => {
      this.clientesExistentes = clientes;
      this.checkDuplicado();
    });

    this.form.valueChanges.subscribe(() => this.checkDuplicado());
  }

  private checkDuplicado(): void {
    if (this.guardando) return;
    const value = this.form.value;
    const nombre = normalizeSearch(value.nombreCompleto);
    const apellidos = normalizeSearch(value.apellidos);

    if (!nombre || !apellidos) {
      this.duplicado = null;
      return;
    }

    const existente = this.clientesExistentes.find((c) => {
      if (this.esEdicion && this.clienteId && c.id === this.clienteId) return false;
      const cNombre = normalizeSearch(c.nombreCompleto);
      const cApellidos = normalizeSearch(c.apellidos);
      return cNombre === nombre && cApellidos === apellidos;
    });

    this.duplicado = existente
      ? `${existente.nombreCompleto} ${existente.apellidos}`
      : null;
  }

  private toTitleCase(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .map((w) => (w ? w.charAt(0).toLocaleUpperCase() + w.slice(1) : ''))
      .join(' ');
  }

  hasError(controlName: string): boolean {
    const ctrl = this.form.get(controlName);
    if (!ctrl) return false;
    return ctrl.invalid && (this.submitted || ctrl.touched);
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.duplicado) return;
    if (this.form.valid && !this.guardando) {
      this.guardando = true;
      const formValue = this.form.value;
      const cliente = {
        nombreCompleto: this.toTitleCase(formValue.nombreCompleto ?? ''),
        apellidos: this.toTitleCase(formValue.apellidos ?? ''),
        telefono: formValue.telefono ?? '',
        profesion: formValue.profesion ?? '',
        tallaCamisa: formValue.tallaCamisa ?? '',
        tallaPantalon: formValue.tallaPantalon ?? '',
        tallaMandil: formValue.tallaMandil ?? '',
        especificaciones: formValue.especificaciones ?? '',
      };
      const finalizar = () => {
        this.guardando = false;
      };
      if (this.esEdicion && this.clienteId) {
        this.clientesService
          .updateCliente(this.clienteId, cliente)
          .then(() => this.router.navigate(['/clientes']))
          .finally(finalizar);
      } else {
        this.clientesService
          .addCliente(cliente)
          .then((docRef) => {
            const queryParams: { id: string; empresaId?: string } = { id: docRef.id };
            if (this.empresaId) {
              queryParams.empresaId = this.empresaId;
            }
            this.router.navigate(['/pedidos/nuevo'], { queryParams });
          })
          .finally(finalizar);
      }
    }
  }
}
