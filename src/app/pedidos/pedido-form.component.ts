import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable, combineLatest } from 'rxjs'
import { map, startWith } from 'rxjs/operators'
import { ClientesService } from '../clientes/clientes.service'
import { MedidasService } from '../medidas/medidas.service'
import { Cliente } from '../models/cliente.model'
import { PedidoEmpresa } from '../models/pedido-empresa.model'
import { PedidosEmpresaService } from '../pedidos-empresa/pedidos-empresa.service'
import { PedidosService } from './pedidos.service'
import { ResumenComponent } from '../resumen/resumen.component'

@Component({
  standalone: true,
  selector: 'app-pedido-form',
  imports: [CommonModule, ReactiveFormsModule, ResumenComponent],
  template: `
    <!-- Modal WhatsApp -->
    <div class="modal fade" [class.show]="mostrarModalWhatsApp" [style.display]="mostrarModalWhatsApp ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="fa-brands fa-whatsapp me-2"></i>Enviar WhatsApp al cliente</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">Se enviará el siguiente mensaje a <strong>{{ clienteSeleccionado?.nombreCompleto }} {{ clienteSeleccionado?.apellidos }}</strong>:</p>
            <div class="bg-light p-3 rounded border" style="white-space: pre-line; font-size: 0.9rem;">{{ mensajeWhatsApp }}</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cerrarModalWhatsApp()">No enviar</button>
            <button type="button" class="btn btn-success" (click)="enviarWhatsApp()">
              <i class="fa-brands fa-whatsapp me-1"></i> Enviar WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="mostrarModalWhatsApp"></div>

    <h2 class="fw-bold mb-3">
      {{ pedidoId ? 'Editar Pedido' : 'Nuevo Pedido' }}
      <small class="text-muted fs-6" *ngIf="empresaContexto">— Empresa: {{ empresaContexto.nombreEmpresa }}</small>
    </h2>
    <div class="alert alert-info py-2" *ngIf="empresaContexto">
      <i class="fa-solid fa-circle-info me-1"></i>
      Este empleado pertenece al pedido de empresa <strong>{{ empresaContexto.nombreEmpresa }}</strong>.
      La fecha de entrega y el estado se heredan de la empresa.
    </div>
    <div class="row">
    <div class="col-lg-8 col-md-12">
    <div class="card border-0 shadow-sm">
    <div class="card-body p-4">
    <form
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
    >
      <div class="row align-items-end mb-3">
        <div class="col-md-8 position-relative">
          <label class="form-label">Cliente</label>
          <input
            type="text"
            class="form-control"
            placeholder="Buscar cliente por nombre o apellido"
            [formControl]="clienteBusquedaControl"
            autocomplete="off"
            (focus)="buscadorActivo = true"
            (blur)="onBlurBuscador()"
          />
          <div
            class="list-group position-absolute w-100"
            style="z-index:10;"
            *ngIf="
              buscadorActivo &&
              clienteBusquedaControl.value &&
              (clientesFiltrados$ | async)?.length
            "
          >
            <button
              type="button"
              class="list-group-item list-group-item-action"
              *ngFor="let c of clientesFiltrados$ | async"
              (mousedown)="seleccionarCliente(c)"
            >
              {{ c.nombreCompleto }} {{ c.apellidos }}
            </button>
          </div>
        </div>
        <div class="col-md-4 text-end">
          <button
            type="button"
            class="btn btn-outline-primary mt-4 w-100"
            (click)="crearCliente()"
          >
            <i class="fa-solid fa-plus me-1"></i> Agregar cliente
          </button>
        </div>
      </div>
      <div *ngIf="clienteSeleccionado" class="alert alert-info mb-3">
        Cliente seleccionado:
        <strong
          >{{ clienteSeleccionado.nombreCompleto }}
          {{ clienteSeleccionado.apellidos }}</strong
        >
      </div>
      <div *ngIf="clienteDuplicado" class="alert alert-danger mb-3">
        <i class="fa-solid fa-triangle-exclamation me-1"></i>
        Este empleado ya está registrado en el pedido de
        <strong>{{ empresaContexto?.nombreEmpresa }}</strong>. No se puede agregar dos veces.
      </div>
      <div class="row mb-3">
        <div class="col-md-3 mb-2" *ngIf="!empresaContexto">
          <label class="form-label">Fecha de entrega</label>
          <input
            formControlName="fechaEntrega"
            type="date"
            [min]="hoy"
            required
            class="form-control"
          />
        </div>
        <div class="col-md-3 mb-2" *ngIf="!empresaContexto">
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
          <input
            formControlName="precio"
            type="number"
            placeholder="Precio"
            class="form-control"
          />
        </div>
        <div class="col-md-2 mb-2">
          <label class="form-label">Abono</label>
          <input
            formControlName="abono"
            type="number"
            placeholder="Abono"
            class="form-control"
          />
        </div>
        <div class="col-md-2 mb-2">
          <label class="form-label">Saldo</label>
          <input
            formControlName="saldo"
            type="number"
            placeholder="Saldo"
            class="form-control"
            readonly
          />
        </div>
      </div>
      <div class="mb-3">
        <div class="row">
          <div class="col-md-3 mb-2">
            <label class="form-label">Cantidad de ternos</label>
            <input
              formControlName="cantidadTernos"
              type="number"
              min="1"
              class="form-control"
              placeholder="Cantidad de ternos"
            />
          </div>
          <div class="col-md-9 mb-2">
            <label class="form-label">Descripción</label>
            <textarea
              formControlName="descripcion"
              placeholder="Descripción"
              required
              class="form-control"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>
      <fieldset class="border rounded p-3 mb-3">
        <legend class="float-none w-auto px-2 fs-6 fw-semibold text-muted">
          <i class="fa-solid fa-thread me-1"></i> Bordado
        </legend>
        <div class="form-check form-switch mb-2">
          <input
            class="form-check-input"
            type="checkbox"
            id="bordadoActivoCheck"
            formControlName="bordadoActivo"
          />
          <label class="form-check-label" for="bordadoActivoCheck">
            Incluye bordado
          </label>
        </div>
        <div *ngIf="form.get('bordadoActivo')?.value" class="row">
          <div class="col-md-6 mb-2">
            <label class="form-label">Nombre</label>
            <input
              formControlName="bordadoNombre"
              type="text"
              class="form-control"
              placeholder="Nombre a bordar"
            />
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label">Profesión</label>
            <input
              formControlName="bordadoProfesion"
              type="text"
              class="form-control"
              placeholder="Profesión a bordar"
            />
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label">Logos</label>
            <input
              formControlName="bordadoLogos"
              type="text"
              class="form-control"
              placeholder="Logos a bordar"
            />
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label">Bordado personalizado</label>
            <input
              formControlName="bordadoPersonalizado"
              type="text"
              class="form-control"
              placeholder="Texto/diseño personalizado"
            />
          </div>
        </div>
      </fieldset>
      <div class="d-flex justify-content-end gap-2 mt-3">
        <button type="button" class="btn btn-outline-secondary px-4" (click)="cancelar()" [disabled]="guardando">Cancelar</button>
            <button type="submit" class="btn btn-success px-5" [disabled]="form.invalid || !clienteSeleccionado || guardando || clienteDuplicado">
              <span *ngIf="guardando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Guardar
            </button>
      </div>
    </form>
    </div>
    </div>
    </div>
     <div class="col-lg-4 d-none d-lg-block">
        <app-resumen></app-resumen>
      </div>
    </div>
  `,
})
export class PedidoFormComponent implements OnInit {
  guardando = false;
  pedidoId: string | null = null;
  empresaContexto: PedidoEmpresa | null = null;
  clientesYaEnEmpresa: Set<string> = new Set();
  clienteDuplicado = false;
  hoy = new Date().toISOString().slice(0, 10);
  buscadorActivo = false;
  mostrarModalWhatsApp = false;
  mensajeWhatsApp = '';
  telefonoWhatsApp = '';
  whatsAppUrl = '';
  form = this.fb.group({
    cantidadTernos: ['', Validators.required],
    descripcion: ['', Validators.required],
    fechaEntrega: ['', Validators.required],
    estado: ['pendiente', Validators.required],
    precio: [undefined as number | null | undefined],
    abono: [0 as number | null | undefined],
    saldo: [undefined as number | null | undefined],
    notas: [''],
    bordadoActivo: [true],
    bordadoNombre: [''],
    bordadoProfesion: [''],
    bordadoLogos: [''],
    bordadoPersonalizado: [''],
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
    private clientesService: ClientesService,
    private pedidosEmpresaService: PedidosEmpresaService,
  ) {
    this.clientes$ = this.clientesService.getClientes();
    this.clientesFiltrados$ = combineLatest([
      this.clientes$,
      this.clienteBusquedaControl.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([clientes, filtro]) => {
        const f = (filtro || '').toLowerCase();
        if (!f) return clientes;
        if (!f.includes(' ')) {
          return clientes.filter((c) =>
            c.nombreCompleto.toLowerCase().includes(f),
          );
        }
        return clientes.filter(
          (c) =>
            c.nombreCompleto.toLowerCase().includes(f) ||
            c.apellidos?.toLowerCase().includes(f),
        );
      }),
    );
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const empresaId: string | undefined = params['empresaId'];
      const clienteIdQuery: string | undefined = params['id'];
      if (empresaId) {
        this.pedidosEmpresaService.getPedidoEmpresa(empresaId).subscribe((empresa) => {
          if (empresa) {
            this.empresaContexto = empresa;
            this.form.patchValue({
              fechaEntrega: empresa.fechaEntrega,
              estado: empresa.estado,
            });
          }
        });
        this.cargarEmpleadosEmpresa(empresaId);
      } else if (clienteIdQuery && !this.pedidoId) {
        this.clientesService.getCliente(clienteIdQuery).subscribe((cliente) => {
          if (cliente) {
            this.seleccionarCliente(cliente);
          }
        });
      }
    });

    // Si la ruta es /pedidos/editar/:id, obtener el id y cargar el pedido
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.pedidoId = id;
      this.pedidosService.getPedidos().subscribe((pedidos) => {
        const pedido = pedidos.find((p) => p.id === id);
        if (!pedido) return;
        this.form.patchValue({
          descripcion: pedido.descripcion,
          fechaEntrega: this.formatFechaEntrega(pedido.fechaEntrega),
          estado: pedido.estado,
          precio:
            typeof pedido.precio === 'number' ? pedido.precio : undefined,
          abono:
            typeof pedido.abono === 'number' ? pedido.abono : undefined,
          saldo:
            typeof pedido.saldo === 'number' ? pedido.saldo : undefined,
          notas: pedido.notas ?? '',
          cantidadTernos:
            typeof pedido.cantidadTernos === 'number'
              ? String(pedido.cantidadTernos)
              : '',
          bordadoActivo: pedido.bordadoActivo ?? true,
          bordadoNombre: pedido.bordadoNombre ?? '',
          bordadoProfesion: pedido.bordadoProfesion ?? '',
          bordadoLogos: pedido.bordadoLogos ?? '',
          bordadoPersonalizado: pedido.bordadoPersonalizado ?? '',
        });
        this.clientesService
          .getCliente(pedido.clienteId)
          .subscribe((cliente) => {
            if (cliente) {
              this.seleccionarCliente(cliente);
            }
          });
        if (pedido.pedidoEmpresaId && !this.empresaContexto) {
          this.pedidosEmpresaService.getPedidoEmpresa(pedido.pedidoEmpresaId).subscribe((empresa) => {
            if (empresa) {
              this.empresaContexto = empresa;
            }
          });
          this.cargarEmpleadosEmpresa(pedido.pedidoEmpresaId);
        }
      });
    });
    // Actualizar saldo cada vez que cambie precio o abono
    this.form
      .get('precio')
      ?.valueChanges.subscribe(() => this.actualizarSaldo());
    this.form
      .get('abono')
      ?.valueChanges.subscribe(() => this.actualizarSaldo());
    this.actualizarSaldo();
  }

  formatFechaEntrega(fecha: any): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') return fecha;
    if (fecha instanceof Date) {
      const y = fecha.getFullYear();
      const m = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const d = fecha.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return '';
  }

  actualizarSaldo() {
    const precio = Number(this.form.get('precio')?.value ?? 0);
    const abono = Number(this.form.get('abono')?.value ?? 0);
    this.form
      .get('saldo')
      ?.setValue((precio - abono) as any, { emitEvent: false });
  }

  cancelar() {
    if (this.empresaContexto) {
      this.router.navigate(['/pedidos-empresa', this.empresaContexto.id]);
    } else {
      this.router.navigate(['/pedidos']);
    }
  }

  onBlurBuscador() {
    setTimeout(() => (this.buscadorActivo = false), 200);
  }

  seleccionarCliente(cliente: Cliente) {
    this.clienteSeleccionado = cliente;
    this.clienteBusquedaControl.setValue(
      `${cliente.nombreCompleto} ${cliente.apellidos}`,
    );
    if (!this.form.get('bordadoNombre')?.value) {
      this.form.patchValue({
        bordadoNombre: `${cliente.nombreCompleto} ${cliente.apellidos}`.trim(),
      });
    }
    if (!this.form.get('bordadoProfesion')?.value && cliente.profesion) {
      this.form.patchValue({ bordadoProfesion: cliente.profesion });
    }
    this.verificarClienteDuplicado();
  }

  private cargarEmpleadosEmpresa(empresaId: string): void {
    this.pedidosService.getPedidosByEmpresa(empresaId).subscribe((pedidos) => {
      this.clientesYaEnEmpresa = new Set(
        pedidos
          .filter((p) => p.id !== this.pedidoId)
          .map((p) => p.clienteId),
      );
      this.verificarClienteDuplicado();
    });
  }

  private verificarClienteDuplicado(): void {
    this.clienteDuplicado =
      !!this.empresaContexto &&
      !!this.clienteSeleccionado &&
      this.clientesYaEnEmpresa.has(this.clienteSeleccionado.id);
  }

  crearCliente() {
    this.router.navigate(['/clientes/nuevo']);
  }

  prepararWhatsApp(pedido: Partial<import('../models/pedido.model').Pedido>) {
    if (!this.clienteSeleccionado?.telefono) {
      this.router.navigate(['/pedidos']);
      return;
    }
    let telefono = this.clienteSeleccionado.telefono.replace(/\D/g, '');
    if (telefono.startsWith('0')) {
      telefono = '593' + telefono.substring(1);
    } else if (!telefono.startsWith('593')) {
      telefono = '593' + telefono;
    }
    this.telefonoWhatsApp = telefono;
    const cliente = `${this.clienteSeleccionado.nombreCompleto} ${this.clienteSeleccionado.apellidos}`;
    const lineas = [
      `Hola ${cliente}, su pedido ha sido registrado en *Indumedin*.`,
      '',
      `*Detalles del pedido:*`,
      pedido.descripcion ? `- Descripción: ${pedido.descripcion}` : '',
      pedido.cantidadTernos ? `- Cantidad de ternos: ${pedido.cantidadTernos}` : '',
      pedido.fechaEntrega ? `- Fecha de entrega: ${pedido.fechaEntrega}` : '',
      pedido.precio != null ? `- Precio: $${pedido.precio}` : '',
      pedido.abono != null ? `- Abono: $${pedido.abono}` : '',
      pedido.saldo != null ? `- Saldo pendiente: $${pedido.saldo}` : '',
      '',
      'Gracias por su preferencia.',
    ];
    this.mensajeWhatsApp = lineas.filter(l => l !== '').join('\n');
    const texto = encodeURIComponent(this.mensajeWhatsApp);
    const isMobile = /android|iphone|ipad/i.test(navigator.userAgent);
    this.whatsAppUrl = isMobile
      ? `intent://send?phone=${telefono}&text=${texto}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end`
      : `https://web.whatsapp.com/send?phone=${telefono}&text=${texto}`;
    this.mostrarModalWhatsApp = true;
  }

  enviarWhatsApp() {
    try {
      const prev = (window as any).__whatsappPopup;
      if (prev && !prev.closed) {
        prev.close();
      }
    } catch (_) {}
    (window as any).__whatsappPopup = window.open(
      this.whatsAppUrl,
      'whatsapp_indumedin',
      'popup,width=1000,height=700'
    );
    this.cerrarModalWhatsApp();
  }

  cerrarModalWhatsApp() {
    this.mostrarModalWhatsApp = false;
    this.router.navigate(['/pedidos']);
  }

  onSubmit() {
    if (this.clienteDuplicado) return;
    if (this.form.valid && this.clienteSeleccionado && !this.guardando) {
      this.guardando = true;
      const formValue = this.form.value;
      const pedido: Partial<import('../models/pedido.model').Pedido> = {
        clienteId: this.clienteSeleccionado!.id,
        descripcion: formValue.descripcion ?? '',
        estado: formValue.estado as 'pendiente' | 'en_proceso' | 'terminado' | 'entregado' | undefined,
        precio: formValue.precio ?? undefined,
        abono: formValue.abono ?? undefined,
        saldo: formValue.saldo ?? undefined,
        notas: formValue.notas ?? '',
        fechaEntrega: formValue.fechaEntrega ? formValue.fechaEntrega : undefined,
        cantidadTernos: formValue.cantidadTernos !== '' && formValue.cantidadTernos != null ? Number(formValue.cantidadTernos) : undefined,
        bordadoActivo: formValue.bordadoActivo ?? false,
        bordadoNombre: formValue.bordadoActivo ? (formValue.bordadoNombre ?? '') : '',
        bordadoProfesion: formValue.bordadoActivo ? (formValue.bordadoProfesion ?? '') : '',
        bordadoLogos: formValue.bordadoActivo ? (formValue.bordadoLogos ?? '') : '',
        bordadoPersonalizado: formValue.bordadoActivo ? (formValue.bordadoPersonalizado ?? '') : '',
      };
      if (this.empresaContexto) {
        pedido.pedidoEmpresaId = this.empresaContexto.id;
      }
      const finalizar = () => { this.guardando = false; };
      const afterSave = () => {
        if (this.empresaContexto) {
          this.router.navigate(['/pedidos-empresa', this.empresaContexto.id]);
        } else {
          this.prepararWhatsApp(pedido);
        }
      };
      if (this.pedidoId) {
        this.pedidosService.updatePedido(this.pedidoId, pedido).then(afterSave).finally(finalizar);
      } else {
        this.pedidosService.addPedido(pedido).then(afterSave).finally(finalizar);
      }
    }
  }
}
