import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, Output } from '@angular/core'

/** Resultado de paginar una lista en memoria. */
export interface PaginaResultado<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  desde: number;
  hasta: number;
}

/**
 * Corta una lista para la página pedida y ajusta la página cuando quedó fuera
 * de rango (por ejemplo al filtrar y reducir el total de resultados).
 */
export function paginar<T>(lista: T[], page: number, pageSize: number): PaginaResultado<T> {
  const total = lista.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagina = Math.min(Math.max(page, 1), totalPages);
  const start = (pagina - 1) * pageSize;
  const items = lista.slice(start, start + pageSize);
  return {
    items,
    page: pagina,
    totalPages,
    total,
    desde: total === 0 ? 0 : start + 1,
    hasta: start + items.length,
  };
}

/**
 * Paginador reutilizable: muestra el rango visible y los botones de página.
 * Se oculta solo cuando no hay resultados.
 */
@Component({
  standalone: true,
  selector: 'app-paginacion',
  imports: [CommonModule],
  template: `
    <div
      class="d-flex flex-wrap justify-content-between align-items-center gap-2"
      [class.card-footer]="enTarjeta"
      [class.mt-3]="!enTarjeta"
      [class.pt-3]="!enTarjeta"
      [class.border-top]="!enTarjeta"
      *ngIf="total > 0">
      <small class="text-muted">
        Mostrando {{ desde }}-{{ hasta }} de {{ total }} {{ total === 1 ? etiqueta : plural }}
      </small>
      <nav *ngIf="totalPages > 1">
        <ul class="pagination pagination-sm mb-0 flex-wrap">
          <li class="page-item" [class.disabled]="page === 1">
            <button type="button" class="page-link" (click)="irA(page - 1)">&laquo;</button>
          </li>
          <ng-container *ngFor="let p of paginas">
            <li class="page-item disabled" *ngIf="p === null">
              <span class="page-link">...</span>
            </li>
            <li class="page-item" *ngIf="p !== null" [class.active]="page === p">
              <button type="button" class="page-link" (click)="irA(p)">{{ p }}</button>
            </li>
          </ng-container>
          <li class="page-item" [class.disabled]="page === totalPages">
            <button type="button" class="page-link" (click)="irA(page + 1)">&raquo;</button>
          </li>
        </ul>
      </nav>
    </div>
  `,
})
export class PaginacionComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() total = 0;
  @Input() desde = 0;
  @Input() hasta = 0;
  /** Nombre en singular de lo que se pagina ("factura", "pedido", ...). */
  @Input() etiqueta = 'resultado';
  /** Plural, si no es simplemente la etiqueta con una "s". */
  @Input() etiquetaPlural = '';
  /** `true` cuando el paginador va dentro de una tarjeta (usa `card-footer`). */
  @Input() enTarjeta = true;
  @Output() pageChange = new EventEmitter<number>();

  get plural(): string {
    return this.etiquetaPlural || `${this.etiqueta}s`;
  }

  /** Páginas visibles; `null` representa los puntos suspensivos. */
  get paginas(): (number | null)[] {
    const items: (number | null)[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      const visible =
        i === 1 || i === this.totalPages || (i >= this.page - 1 && i <= this.page + 1);
      if (visible) {
        items.push(i);
      } else if (items[items.length - 1] !== null) {
        items.push(null);
      }
    }
    return items;
  }

  irA(page: number): void {
    const valida = Math.min(Math.max(page, 1), this.totalPages || 1);
    if (valida !== this.page) {
      this.pageChange.emit(valida);
    }
  }
}
