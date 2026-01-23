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
    <h2>{{medidaId ? 'Editar' : 'Nueva'}} Medidas</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="busto" type="number" placeholder="Busto" required>
      <input formControlName="cintura" type="number" placeholder="Cintura" required>
      <input formControlName="cadera" type="number" placeholder="Cadera" required>
      <input formControlName="hombro" type="number" placeholder="Hombro" required>
      <input formControlName="largoManga" type="number" placeholder="Largo de manga" required>
      <input formControlName="largoPantalon" type="number" placeholder="Largo de pantalón" required>
      <button type="submit" [disabled]="form.invalid">Guardar</button>
    </form>
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

  constructor(private fb: FormBuilder, private medidasService: MedidasService, private router: Router) {}

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
