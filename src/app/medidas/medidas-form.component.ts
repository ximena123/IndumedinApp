import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { MedidasService } from './medidas.service'

@Component({
  standalone: true,
  selector: 'app-medidas-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2 class="fw-bold mb-3">{{medidaId ? 'Editar' : 'Nuevas'}} Medidas</h2>
    <div class="card shadow-sm border-0" style="max-width: 600px;">
      <div class="card-header bg-primary text-white">
        <i class="fa-solid fa-ruler me-2"></i>Medidas del cliente
      </div>
      <div class="card-body p-4">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="row g-3">
          <div class="col-md-4 col-6">
            <label class="form-label">Busto</label>
            <div class="input-group">
              <input formControlName="busto" type="number" class="form-control" placeholder="0" required>
              <span class="input-group-text">cm</span>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <label class="form-label">Cintura</label>
            <div class="input-group">
              <input formControlName="cintura" type="number" class="form-control" placeholder="0" required>
              <span class="input-group-text">cm</span>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <label class="form-label">Cadera</label>
            <div class="input-group">
              <input formControlName="cadera" type="number" class="form-control" placeholder="0" required>
              <span class="input-group-text">cm</span>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <label class="form-label">Hombro</label>
            <div class="input-group">
              <input formControlName="hombro" type="number" class="form-control" placeholder="0" required>
              <span class="input-group-text">cm</span>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <label class="form-label">Largo Manga</label>
            <div class="input-group">
              <input formControlName="largoManga" type="number" class="form-control" placeholder="0" required>
              <span class="input-group-text">cm</span>
            </div>
          </div>
          <div class="col-md-4 col-6">
            <label class="form-label">Largo Pantalon</label>
            <div class="input-group">
              <input formControlName="largoPantalon" type="number" class="form-control" placeholder="0" required>
              <span class="input-group-text">cm</span>
            </div>
          </div>
          <div class="col-12 d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-outline-secondary px-4" (click)="router.navigate(['/clientes', clienteId])">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success px-4" [disabled]="form.invalid">
              <i class="fa-solid fa-check me-1"></i> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class MedidasFormComponent {
  @Input() medidaId?: string;
  @Input() clienteId!: string;
  form = this.fb.group({
    busto: [0, Validators.required],
    cintura: [0, Validators.required],
    cadera: [0, Validators.required],
    hombro: [0, Validators.required],
    largoManga: [0, Validators.required],
    largoPantalon: [0, Validators.required]
  });

  constructor(private fb: FormBuilder, private medidasService: MedidasService, public router: Router) {}

  onSubmit() {
    if (this.form.valid) {
      const rawValue = this.form.getRawValue();
      const formValue = {
        busto: Number(rawValue.busto ?? 0),
        cintura: Number(rawValue.cintura ?? 0),
        cadera: Number(rawValue.cadera ?? 0),
        hombro: Number(rawValue.hombro ?? 0),
        largoManga: Number(rawValue.largoManga ?? 0),
        largoPantalon: Number(rawValue.largoPantalon ?? 0)
      };
      if (this.medidaId) {
        this.medidasService.updateMedidas(this.medidaId, formValue).then(() => this.router.navigate(['/clientes', this.clienteId]));
      } else {
        this.medidasService.addMedidas({ ...formValue, clienteId: this.clienteId }).then(() => this.router.navigate(['/clientes', this.clienteId]));
      }
    }
  }
}
