import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { Cliente } from '../models/cliente.model'
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
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Nombre(s)</label>
            <input formControlName="nombreCompleto" class="form-control" placeholder="Nombre(s)" required />
          </div>
          <div class="col-md-6">
            <label class="form-label">Apellidos</label>
            <input formControlName="apellidos" class="form-control" placeholder="Apellidos" required />
          </div>
          <div class="col-md-6">
            <label class="form-label">Telefono</label>
            <div class="input-group">
              <span class="input-group-text"><i class="fa-solid fa-phone"></i></span>
              <input formControlName="telefono" class="form-control" placeholder="Telefono" />
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Profesion</label>
            <input formControlName="profesion" class="form-control" placeholder="Profesion" />
          </div>
          <hr class="my-2">
          <div class="col-md-4">
            <label class="form-label">Talla Camisa</label>
            <input formControlName="tallaCamisa" class="form-control" placeholder="Ej: M, L, XL" required />
          </div>
          <div class="col-md-4">
            <label class="form-label">Talla Pantalon</label>
            <input formControlName="tallaPantalon" class="form-control" placeholder="Ej: 32, 34" required />
          </div>
          <div class="col-md-4">
            <label class="form-label">Talla Mandil</label>
            <input formControlName="tallaMandil" class="form-control" placeholder="Ej: M, L" />
          </div>
          <div class="col-12">
            <label class="form-label">Especificaciones</label>
            <textarea formControlName="especificaciones" class="form-control" placeholder="Notas adicionales sobre el cliente..." rows="3"></textarea>
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
            <button type="submit" class="btn btn-success px-4" [disabled]="form.invalid || loading || guardando || !!duplicado">
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
  ) {
    // Detectar si es edición por la URL
    const url = this.router.url;
    if (url.includes('/editar/')) {
      const partes = url.split('/');
      this.clienteId = partes[partes.length - 1];
      this.esEdicion = true;
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
    const value = this.form.value;
    const nombre = (value.nombreCompleto ?? '').trim().toLowerCase();
    const apellidos = (value.apellidos ?? '').trim().toLowerCase();
    const telefono = (value.telefono ?? '').replace(/\D/g, '');

    if (!nombre && !telefono) {
      this.duplicado = null;
      return;
    }

    const existente = this.clientesExistentes.find((c) => {
      if (this.esEdicion && this.clienteId && c.id === this.clienteId) return false;
      const cNombre = (c.nombreCompleto ?? '').trim().toLowerCase();
      const cApellidos = (c.apellidos ?? '').trim().toLowerCase();
      const cTel = (c.telefono ?? '').replace(/\D/g, '');
      const mismoNombre =
        !!nombre && !!apellidos && cNombre === nombre && cApellidos === apellidos;
      const mismoTel = !!telefono && !!cTel && cTel === telefono;
      return mismoNombre || mismoTel;
    });

    this.duplicado = existente
      ? `${existente.nombreCompleto} ${existente.apellidos}${existente.telefono ? ' — ' + existente.telefono : ''}`
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

  onSubmit() {
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
            this.router.navigate(['/pedidos/nuevo'], {
              queryParams: { id: docRef.id },
            });
          })
          .finally(finalizar);
      }
    }
  }
}
