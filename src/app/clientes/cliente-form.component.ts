import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { ClientesService } from './clientes.service'

@Component({
  standalone: true,
  selector: 'app-cliente-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="cliente-form-container">
      <h2>{{esEdicion ? 'Editar' : 'Nuevo'}} Cliente</h2>
      <div *ngIf="loading" class="d-flex justify-content-center align-items-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSubmit()" class="row g-3">
        <div class="col-md-6">
          <input formControlName="nombreCompleto" class="form-control" placeholder="Nombre(s)" required>
        </div>
        <div class="col-md-6">
          <input formControlName="apellidos" class="form-control" placeholder="Apellidos" required>
        </div>
        <div class="col-md-6">
          <input formControlName="telefono" class="form-control" placeholder="Teléfono">
        </div>
        <div class="col-md-6">
          <input formControlName="profesion" class="form-control" placeholder="Profesión">
        </div>
        <div class="col-md-6">
          <input formControlName="tallaCamisa" class="form-control" placeholder="Talla de camisa">
        </div>
        <div class="col-md-6">
          <input formControlName="tallaPantalon" class="form-control" placeholder="Talla de pantalón">
        </div>
        <div class="col-md-6">
          <input formControlName="tallaMandil" class="form-control" placeholder="Talla de mandil">
        </div>
        <div class="col-12">
          <textarea formControlName="especificaciones" class="form-control" placeholder="Especificaciones"></textarea>
        </div>
        <div *ngIf="error" class="alert alert-danger col-12">{{error}}</div>
        <div class="col-12 d-flex justify-content-end gap-2">
          <button type="submit" class="btn btn-success" [disabled]="form.invalid || loading">
            {{ loading ? 'Guardando...' : 'Guardar' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="router.navigate(['/clientes'])" [disabled]="loading">Cancelar</button>
        </div>
      </form>
    </div>
  `
})
export class ClienteFormComponent implements OnInit {
  clienteId?: string;
  esEdicion = false;
  form = this.fb.group({
    nombreCompleto: ['', Validators.required],
    apellidos: ['', Validators.required],
    telefono: [''],
    profesion: [''],
    tallaCamisa: [''],
    tallaPantalon: [''],
    tallaMandil: [''],
    especificaciones: [''],
  });
  loading = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private clientesService: ClientesService, public router: Router) {
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
        next: cliente => {
          this.form.patchValue(cliente);
          this.loading = false;
        },
        error: () => {
          this.error = 'No se pudo cargar el cliente';
          this.loading = false;
        }
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const cliente = {
        nombreCompleto: formValue.nombreCompleto ?? '',
        apellidos: formValue.apellidos ?? '',
        telefono: formValue.telefono ?? '',
        profesion: formValue.profesion ?? '',
        tallaCamisa: formValue.tallaCamisa ?? '',
        tallaPantalon: formValue.tallaPantalon ?? '',
        tallaMandil: formValue.tallaMandil ?? '',
        especificaciones: formValue.especificaciones ?? ''
      };
      if (this.esEdicion && this.clienteId) {
        this.clientesService.updateCliente(this.clienteId, cliente).then(() => this.router.navigate(['/clientes']));
      } else {
        this.clientesService.addCliente(cliente).then((docRef) => {
          // docRef es la referencia al documento creado
          this.router.navigate(['/pedidos/nuevo'], { queryParams: { id: docRef.id } });
        });
      }
    }
  }
}
