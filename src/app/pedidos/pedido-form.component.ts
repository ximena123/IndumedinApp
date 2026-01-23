import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable, combineLatest } from 'rxjs'
import { map, startWith } from 'rxjs/operators'
import { ClientesService } from '../clientes/clientes.service'
import { MedidasService } from '../medidas/medidas.service'
import { Cliente } from '../models/cliente.model'
import { PedidosService } from './pedidos.service'

@Component({
  standalone: true,
  selector: 'app-pedido-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h2>Nuevo Pedido</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-4 bg-white rounded shadow-lg" style="max-width:900px;margin:auto;">
      <div class="row align-items-end mb-3">
        <div class="col-md-8 position-relative">
          <label class="form-label">Cliente</label>
          <input type="text" class="form-control" placeholder="Buscar cliente por nombre o apellido"
            [formControl]="clienteBusquedaControl" autocomplete="off"
            (focus)="buscadorActivo = true" (blur)="onBlurBuscador()">
          <div class="list-group position-absolute w-100"
            style="z-index:10;"
            *ngIf="buscadorActivo && clienteBusquedaControl.value && (clientesFiltrados$ | async)?.length">
            <button type="button" class="list-group-item list-group-item-action"
              *ngFor="let c of clientesFiltrados$ | async"
              (mousedown)="seleccionarCliente(c)">
              {{c.nombreCompleto}} {{c.apellidos}}
            </button>
          </div>
        </div>
        <div class="col-md-4 text-end">
          <button type="button" class="btn btn-primary mt-4 w-100" (click)="crearCliente()">+ Agregar cliente</button>
        </div>
      </div>
      <div *ngIf="clienteSeleccionado" class="alert alert-info mb-3">
        Cliente seleccionado: <strong>{{clienteSeleccionado.nombreCompleto}} {{clienteSeleccionado.apellidos}}</strong>
      </div>
      <div class="row mb-3">
        <div class="col-md-3 mb-2">
          <label class="form-label">Fecha de entrega</label>
          <input formControlName="fechaEntrega" type="date" required class="form-control">
        </div>
        <div class="col-md-3 mb-2">
          <label class="form-label">Estado</label>
          <select formControlName="estado" class="form-control">
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="terminado">Terminado</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>
        <div class="col-md-2 mb-2">
          <label class="form-label">Precio</label>
          <input formControlName="precio" type="number" placeholder="Precio" class="form-control">
        </div>
        <div class="col-md-2 mb-2">
          <label class="form-label">Abono</label>
          <input formControlName="abono" type="number" placeholder="Abono" class="form-control">
        </div>
        <div class="col-md-2 mb-2">
          <label class="form-label">Saldo</label>
          <input formControlName="saldo" type="number" placeholder="Saldo" class="form-control" readonly>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <textarea formControlName="descripcion" placeholder="Descripción" required class="form-control" rows="3"></textarea>
      </div>
      <div class="text-end">
        <button type="button" class="btn btn-secondary btn-lg px-4 me-2" (click)="cancelar()">Cancelar</button>
        <button type="submit" class="btn btn-success btn-lg px-5" [disabled]="form.invalid || !clienteSeleccionado">Guardar</button>
      </div>
    </form>
  `
})
export class PedidoFormComponent implements OnInit {
        ngAfterViewInit() {
          // Actualizar saldo cada vez que cambie precio o abono
          this.form.get('precio')?.valueChanges.subscribe(() => this.actualizarSaldo());
          this.form.get('abono')?.valueChanges.subscribe(() => this.actualizarSaldo());
          this.actualizarSaldo();
        }

        actualizarSaldo() {
          const precio = Number(this.form.get('precio')?.value ?? 0);
          const abono = Number(this.form.get('abono')?.value ?? 0);
          this.form.get('saldo')?.setValue(precio - abono as any, { emitEvent: false });
        }
      cancelar() {
        this.router.navigate(['/pedidos']);
      }
    buscadorActivo = false;

    onBlurBuscador() {
      // Esperar a que el click en la opción se registre antes de ocultar
      setTimeout(() => this.buscadorActivo = false, 200);
    }
  form = this.fb.group({
    descripcion: ['', Validators.required],
    fechaEntrega: ['', Validators.required],
    estado: ['pendiente', Validators.required],
    precio: [null],
    abono: [null],
    saldo: [null as number | null],
    notas: ['']
  });
  clienteBusquedaControl = new FormControl('');
  clientes$: Observable<Cliente[]>;
  clientesFiltrados$: Observable<Cliente[]>;
  clienteSeleccionado: Cliente | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private pedidosService: PedidosService,
    private medidasService: MedidasService,
    private clientesService: ClientesService
  ) {
    this.clientes$ = this.clientesService.getClientes();
    this.clientesFiltrados$ = combineLatest([
      this.clientes$,
      this.clienteBusquedaControl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([clientes, filtro]) => {
        const f = (filtro || '').toLowerCase();
        if (!f) return clientes;
        // Si el filtro es una sola palabra, buscar solo en nombreCompleto
        if (!f.includes(' ')) {
          return clientes.filter(c => c.nombreCompleto.toLowerCase().includes(f));
        }
        // Si el filtro tiene espacio, buscar en nombreCompleto y apellidos
        return clientes.filter(c =>
          c.nombreCompleto.toLowerCase().includes(f) ||
          (c.apellidos?.toLowerCase().includes(f))
        );
      })
    );
  }

 
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.clientesService.getCliente(id).subscribe(cliente => {
          if (cliente) {
            this.seleccionarCliente(cliente);
          }
        });
      }
    });
  }

  seleccionarCliente(cliente: Cliente) {
    this.clienteSeleccionado = cliente;
    this.clienteBusquedaControl.setValue(`${cliente.nombreCompleto} ${cliente.apellidos}`);
  }

  crearCliente() {
    this.router.navigate(['/clientes/nuevo']);
  }

  onSubmit() {
    if (this.form.valid && this.clienteSeleccionado) {
      const formValue = this.form.value;
      const pedido = {
        clienteId: this.clienteSeleccionado!.id,
        medidaId: null,
        descripcion: formValue.descripcion ?? '',
        estado: formValue.estado ?? 'pendiente',
        precio: formValue.precio ?? undefined,
        abono: formValue.abono ?? undefined,
        saldo: formValue.saldo ?? undefined,
        notas: formValue.notas ?? '',
        fechaEntrega: formValue.fechaEntrega ?? null
      };
      this.pedidosService.addPedido(pedido).then(docRef => {
        this.router.navigate(['/pedidos']);
      });
    }
  }
}
