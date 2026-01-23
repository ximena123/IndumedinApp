import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { BehaviorSubject, Observable, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import { PedidosService } from '../pedidos/pedidos.service'

@Component({
  standalone: true,
  selector: 'app-resumen',
  imports: [CommonModule],
  template: `
    <div class="row">
      <div class="d-none d-lg-block">
        <div class="resumen-container">
          <h5 class="mb-3">📊 Resumen de pedidos por día</h5>
          <div class="mb-2">
            <label class="me-2">
              <input type="date" (change)="onFechaInicio(getValue($event))">
            </label>
          </div>
          <div class="mt-2">
            <strong>Total pedidos:</strong> <span class=" badge bg-primary ms-2">{{totalPedidos$ | async}}</span><br>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ResumenComponent {
  fechaInicio$ = new BehaviorSubject<Date | null>(null);
  fechaFin$ = new BehaviorSubject<Date | null>(null);

  pedidos$ = this.pedidosService.getPedidos();


  resumen$: Observable<{ fecha: string, count: number }[]> = combineLatest([
    this.pedidos$,
    this.fechaInicio$,
    this.fechaFin$
  ]).pipe(
    map(([pedidos, inicio, fin]: [any[], Date | null, Date | null]) => {
      // Convertir fechas a yyyy-MM-dd para comparación exacta
      const inicioStr = inicio ? inicio.toISOString().slice(0, 10) : null;
      const finStr = fin ? fin.toISOString().slice(0, 10) : null;
      // Si no hay filtro de fecha, no mostrar nada
      if (!inicioStr && !finStr) {
        return [];
      }
      // Filtrar por fechaEntrega exacta (como string o Date)
      const filtrados = pedidos.filter((p: { fechaEntrega: string | Date }) => {
        let fechaEntregaStr = '';
        if (p.fechaEntrega instanceof Date) {
          fechaEntregaStr = p.fechaEntrega.toISOString().slice(0, 10);
        } else if (typeof p.fechaEntrega === 'string') {
          fechaEntregaStr = p.fechaEntrega.slice(0, 10);
        }
        if (inicioStr && fechaEntregaStr !== inicioStr) return false;
        if (finStr && fechaEntregaStr !== finStr) return false;
        return true;
      });
      // Agrupar por fechaEntrega (string)
      const agrupado: Record<string, number> = {};
      filtrados.forEach((p: { fechaEntrega: string | Date }) => {
        let fechaEntregaStr = '';
        if (p.fechaEntrega instanceof Date) {
          fechaEntregaStr = p.fechaEntrega.toISOString().slice(0, 10);
        } else if (typeof p.fechaEntrega === 'string') {
          fechaEntregaStr = p.fechaEntrega.slice(0, 10);
        }
        if (fechaEntregaStr) {
          agrupado[fechaEntregaStr] = (agrupado[fechaEntregaStr] || 0) + 1;
        }
      });
      // Ordenar por fecha descendente
      return Object.entries(agrupado)
        .map(([fecha, count]) => ({ fecha, count }))
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
    })
  );

  totalPedidos$ = this.resumen$.pipe(
    map(res => res.reduce((acc, r) => acc + r.count, 0))
  );

  diaMaxPedidos$ = this.resumen$.pipe(
    map(res => {
      if (!res.length) return '-';
      const max = res.reduce((acc, r) => r.count > acc.count ? r : acc, res[0]);
      return `${max.fecha} (${max.count})`;
    })
  );

  constructor(private pedidosService: PedidosService) {}

  getValue(event: Event): string {
    return (event.target && (event.target as HTMLInputElement).value) || '';
  }
  onFechaInicio(value: string) {
    this.fechaInicio$.next(value ? new Date(value + 'T00:00:00') : null);
  }
  onFechaFin(value: string) {
    this.fechaFin$.next(value ? new Date(value + 'T23:59:59') : null);
  }
}
