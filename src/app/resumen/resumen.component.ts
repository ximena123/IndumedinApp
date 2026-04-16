import { CommonModule } from '@angular/common'
import { ChangeDetectorRef, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { getDaysInMonth } from 'date-fns'
import { PedidosService } from '../pedidos/pedidos.service'

@Component({
  standalone: true,
  selector: 'app-resumen',
  imports: [CommonModule, FormsModule],
  template: `
    <style>
      @media (max-width: 600px) {
        .resumen-container {
          padding: 0.5rem;
        }
        .resumen-container .table-responsive {
          overflow-x: auto;
        }
        .resumen-container table {
          font-size: 10px;
          min-width: 420px;
          width: 100%;
          
        }
        .resumen-container th, .resumen-container td {
          padding: 0.1rem !important;
          min-width: 28px !important;
          width: 28px !important;
          height: 38px !important;
        }
        .resumen-container .badge {
          font-size: 9px;
          padding: 0.15em 0.3em;
        }
        .resumen-container h5 {
          font-size: 1rem;
        }
        .resumen-container select, .resumen-container label {
          font-size: 11px;
        }
      }
      @media (max-width: 400px) {
        .resumen-container table {
          font-size: 7px;
        }
        .resumen-container th, .resumen-container td {
          min-width: 15px !important;
          width: 15px !important;
          height: 21px !important;
        }
        .resumen-container .badge {
          font-size: 7px;
        }
      }
    </style>
    <div class="row">
      <div class="col-12">
        <div class="resumen-container mb-4">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-dark text-white d-flex align-items-center">
              <i class="fa-regular fa-calendar me-2"></i>
              <span class="fw-semibold">Calendario de ternos</span>
            </div>
            <div class="card-body p-3">
              <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                <div>
                  <label class="small fw-semibold me-1">Ano:</label>
                  <select class="form-select form-select-sm d-inline-block" style="width: auto;" [(ngModel)]="selectedYear" (ngModelChange)="generarCalendario()">
                    <option *ngFor="let y of years" [value]="y">{{y}}</option>
                  </select>
                </div>
                <div>
                  <label class="small fw-semibold me-1">Mes:</label>
                  <select class="form-select form-select-sm d-inline-block" style="width: auto;" [(ngModel)]="selectedMonth" (ngModelChange)="generarCalendario()">
                    <option *ngFor="let m of meses; let i = index" [ngValue]="i">{{m}}</option>
                  </select>
                </div>
              </div>
              <div class="table-responsive">
                <table class="table table-bordered text-center align-middle mb-0" style="min-width:420px; table-layout: fixed;">
                  <thead>
                    <tr class="table-light">
                      <th *ngFor="let d of dias" class="py-2" style="width: 60px; font-size: 0.8rem;">
                        <span class="d-none d-sm-inline">{{d.largo}}</span>
                        <span class="d-inline d-sm-none">{{d.corto}}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let semana of calendario; let s = index">
                      <td *ngFor="let dia of semana" class="p-1"
                          style="border-radius: 4px;"
                          [ngClass]="{
                            'bg-danger text-white': dia && dia.ternos >= 5,
                            'bg-success text-white': dia && dia.ternos > 0 && dia.ternos < 5
                          }">
                        <div *ngIf="dia">
                          <div><strong>{{dia.dia}}</strong></div>
                          <div *ngIf="dia.ternos > 0" class="badge bg-primary" style="font-size: 0.7rem;">{{dia.ternos}}</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="d-flex gap-3 mt-2 small text-muted">
                <span><span class="badge bg-success">&nbsp;</span> 1-4 ternos</span>
                <span><span class="badge bg-danger">&nbsp;</span> 5+ ternos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ResumenComponent {
  pedidos$ = this.pedidosService.getPedidos();
  dias = [
    { largo: 'Lun', corto: 'L' },
    { largo: 'Mar', corto: 'M' },
    { largo: 'Mié', corto: 'X' },
    { largo: 'Jue', corto: 'J' },
    { largo: 'Vie', corto: 'V' },
    { largo: 'Sáb', corto: 'S' },
    { largo: 'Dom', corto: 'D' },
  ];
  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  years: number[] = [];
  selectedYear: number;
  selectedMonth: number;
  calendario: ({ dia: number, ternos: number } | null)[][] = [];
  ternosPorDia: Record<string, number> = {};

  constructor(private pedidosService: PedidosService, private cdr: ChangeDetectorRef) {
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
    const diasMes = getDaysInMonth(new Date(year, month, 1));
    const primerDia = new Date(year, month, 1);
    let diaSemana = primerDia.getDay(); // 0=domingo, 1=lunes, ...
    diaSemana = diaSemana === 0 ? 6 : diaSemana - 1;
    const semanas: ({ dia: number, ternos: number } | null)[][] = [];
    let semana: ({ dia: number, ternos: number } | null)[] = new Array(7).fill(null);
    let dia = 1;
    // Primera semana
    for (let i = 0; i < 7; i++) {
      if (i >= diaSemana && dia <= diasMes) {
        const key = this.getFechaKey(year, month, dia);
        const ternos = this.ternosPorDia[key] || 0;
        semana[i] = { dia, ternos };
        dia++;
      } else {
        semana[i] = null;
      }
    }
    semanas.push(semana);
    // Siguientes semanas
    while (dia <= diasMes) {
      semana = new Array(7).fill(null);
      for (let i = 0; i < 7; i++) {
        if (dia <= diasMes) {
          const key = this.getFechaKey(year, month, dia);
          const ternos = this.ternosPorDia[key] || 0;
          semana[i] = { dia, ternos };
          dia++;
        } else {
          semana[i] = null;
        }
      }
      semanas.push(semana);
    }
    this.calendario = semanas;
    this.cdr.detectChanges();
  }

  getFechaKey(year: number, month: number, day: number): string {
    // yyyy-MM-dd (mes en base 1, siempre dos dígitos)
    const mes = (month + 1).toString().padStart(2, '0');
    const dia = day.toString().padStart(2, '0');
    return `${year}-${mes}-${dia}`;
  }
}
