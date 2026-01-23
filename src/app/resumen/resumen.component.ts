import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { PedidosService } from '../pedidos/pedidos.service'

@Component({
  standalone: true,
  selector: 'app-resumen',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="row">
      <div class="col-12">
        <div class="resumen-container mb-4">
          <h5 class="mb-3">📅 Calendario de ternos por día</h5>
          <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
            <label>Año:
              <select [(ngModel)]="selectedYear" (ngModelChange)="generarCalendario()">
                <option *ngFor="let y of years" [value]="y">{{y}}</option>
              </select>
            </label>
            <label>Mes:
              <select [(ngModel)]="selectedMonth" (ngModelChange)="generarCalendario()">
                <option *ngFor="let m of meses; let i = index" [value]="i">{{m}}</option>
              </select>
            </label>
          </div>
          <div class="table-responsive">
            <table class="table table-bordered text-center align-middle" style="min-width:420px; table-layout: fixed;">
              <thead>
                <tr>
                  <th *ngFor="let d of dias" style="width: 60px;">{{d}}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let semana of calendario; let s = index">
                  <td *ngFor="let dia of semana">
                    <div *ngIf="dia">
                      <div><strong>{{dia.dia}}</strong></div>
                      <div *ngIf="dia.ternos > 0" class="badge bg-primary">{{dia.ternos}} ternos</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ResumenComponent {
  pedidos$ = this.pedidosService.getPedidos();
  dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  years: number[] = [];
  selectedYear: number;
  selectedMonth: number;
  calendario: ({ dia: number, ternos: number } | null)[][] = [];
  ternosPorDia: Record<string, number> = {};

  constructor(private pedidosService: PedidosService) {
    const hoy = new Date();
    this.selectedYear = hoy.getFullYear();
    this.selectedMonth = hoy.getMonth();
    // Rango de años: 5 atrás y 5 adelante
    const current = hoy.getFullYear();
    for (let y = current - 5; y <= current + 5; y++) {
      this.years.push(y);
    }
    this.pedidos$.subscribe(pedidos => {
      this.ternosPorDia = {};
      pedidos.forEach(p => {
        let fechaEntregaStr = '';
        if (typeof p.fechaEntrega === 'string') {
          fechaEntregaStr = p.fechaEntrega.slice(0, 10);
        } else if (p.fechaEntrega instanceof Date) {
          fechaEntregaStr = p.fechaEntrega.toISOString().slice(0, 10);
        } else if (
          p.fechaEntrega &&
          typeof p.fechaEntrega === 'object' &&
          typeof (p.fechaEntrega as any).toDate === 'function' &&
          typeof p.fechaEntrega !== 'string'
        ) {
          fechaEntregaStr = (p.fechaEntrega as any).toDate().toISOString().slice(0, 10);
        }
        if (fechaEntregaStr) {
          const key = fechaEntregaStr;
          const cantidad = typeof p.cantidadTernos === 'number' ? p.cantidadTernos : 0;
          this.ternosPorDia[key] = (this.ternosPorDia[key] || 0) + cantidad;
        }
      });
      this.generarCalendario();
    });
  }

  generarCalendario() {
    const year = this.selectedYear;
    const month = this.selectedMonth;
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasMes = ultimoDia.getDate();
    // Día de la semana del primer día (0=domingo, 1=lunes...)
    let diaSemana = primerDia.getDay();
    diaSemana = diaSemana === 0 ? 6 : diaSemana - 1; // Ajustar para que lunes=0
    // Si domingo, saltar columna
    if (diaSemana === 6) diaSemana = 0;
    const semanas: ({ dia: number, ternos: number } | null)[][] = [];
    let semana: ({ dia: number, ternos: number } | null)[] = new Array(6).fill(null);
    let dia = 1;
    // Primera semana
    for (let i = 0; i < 6; i++) {
      if (i >= diaSemana) {
        const key = this.getFechaKey(year, month, dia);
        semana[i] = { dia, ternos: this.ternosPorDia[key] || 0 };
        dia++;
      } else {
        semana[i] = null;
      }
    }
    semanas.push(semana);
    // Siguientes semanas
    while (dia <= diasMes) {
      semana = new Array(6).fill(null);
      for (let i = 0; i < 6 && dia <= diasMes; i++) {
        const key = this.getFechaKey(year, month, dia);
        semana[i] = { dia, ternos: this.ternosPorDia[key] || 0 };
        dia++;
      }
      semanas.push(semana);
    }
    this.calendario = semanas;
  }

  getFechaKey(year: number, month: number, day: number): string {
    // yyyy-MM-dd
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
}
