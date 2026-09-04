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
import { DESCUENTO_UTPL, calcularTotales, formatMoneda, redondearArriba2 } from '../shared/money.util'
import { matchesSearch } from '../shared/search.util'
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
      novalidate
    >
      <div class="row align-items-end mb-3">
        <div class="col-md-8 position-relative">
          <label class="form-label">Cliente <span class="text-danger">*</span></label>
          <input
            type="text"
            class="form-control"
            placeholder="Buscar cliente por nombre o apellido"
            [formControl]="clienteBusquedaControl"
            autocomplete="off"
            (focus)="buscadorActivo = true"
            (blur)="onBlurBuscador()"
            [class.is-invalid]="submitted && !clienteSeleccionado"
          />
          <div class="invalid-feedback d-block" *ngIf="submitted && !clienteSeleccionado">
            Selecciona un cliente o crea uno nuevo.
          </div>
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
          <label class="form-label">Fecha de entrega <span class="text-danger">*</span></label>
          <input
            formControlName="fechaEntrega"
            type="date"
            [min]="hoy"
            class="form-control"
            [class.is-invalid]="hasError('fechaEntrega')"
          />
          <div class="invalid-feedback" *ngIf="hasError('fechaEntrega')">La fecha de entrega es requerida.</div>
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
          <label class="form-label">Precio <span class="text-danger" *ngIf="!empresaContexto">*</span></label>
          <input
            formControlName="precio"
            type="number"
            placeholder="Precio"
            class="form-control"
            [class.is-invalid]="hasError('precio')"
          />
          <div class="invalid-feedback" *ngIf="hasError('precio')">El precio es requerido.</div>
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
      <div class="row align-items-end mb-3">
        <div class="col-md-4 mb-2">
          <div class="form-check form-switch mt-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="estudianteUtplCheck"
              formControlName="esEstudianteUtpl"
            />
            <label class="form-check-label" for="estudianteUtplCheck">
              <i class="fa-solid fa-graduation-cap me-1"></i>
              Estudiante UTPL ({{ porcentajeUtpl }}% de descuento)
            </label>
          </div>
        </div>
        <div class="col-md-4 mb-2" *ngIf="form.get('esEstudianteUtpl')?.value">
          <label class="form-label">Descuento UTPL</label>
          <input type="text" class="form-control text-danger" [value]="'-$' + formatearMoneda(descuento)" readonly />
        </div>
        <div class="col-md-4 mb-2">
          <label class="form-label">Total a pagar</label>
          <input type="text" class="form-control fw-bold" [value]="'$' + formatearMoneda(total)" readonly />
        </div>
      </div>
      <div class="mb-3">
        <div class="row">
          <div class="col-md-3 mb-2">
            <label class="form-label">Cantidad de ternos <span class="text-danger">*</span></label>
            <input
              formControlName="cantidadTernos"
              type="number"
              min="1"
              class="form-control"
              placeholder="Cantidad de ternos"
              [class.is-invalid]="hasError('cantidadTernos')"
            />
            <div class="invalid-feedback" *ngIf="hasError('cantidadTernos')">La cantidad de ternos es requerida.</div>
          </div>
          <div class="col-md-9 mb-2">
            <label class="form-label">Descripción <span class="text-danger">*</span></label>
            <textarea
              formControlName="descripcion"
              placeholder="Descripción"
              class="form-control"
              rows="3"
              [class.is-invalid]="hasError('descripcion')"
            ></textarea>
            <div class="invalid-feedback" *ngIf="hasError('descripcion')">La descripción es requerida.</div>
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
      <div *ngIf="submitted && (form.invalid || !clienteSeleccionado)" class="alert alert-warning mb-3">
        <i class="fa-solid fa-triangle-exclamation me-1"></i>
        Por favor completa los campos requeridos marcados en rojo.
      </div>

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button type="button" class="btn btn-outline-secondary px-4" (click)="cancelar()" [disabled]="guardando">Cancelar</button>
            <button type="submit" class="btn btn-success px-5" [disabled]="guardando || clienteDuplicado">
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
  submitted = false;
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
  porcentajeUtpl = DESCUENTO_UTPL * 100;
  descuento = 0;
  total = 0;
  form = this.fb.group({
    cantidadTernos: ['', Validators.required],
    descripcion: ['', Validators.required],
    fechaEntrega: ['', Validators.required],
    estado: ['pendiente', Validators.required],
    precio: [undefined as number | null | undefined, Validators.required],
    esEstudianteUtpl: [false],
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
        const f = filtro || '';
        if (!f) return clientes;
        return clientes.filter((c) =>
          matchesSearch(`${c.nombreCompleto ?? ''} ${c.apellidos ?? ''}`, f),
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
            this.form.get('precio')?.clearValidators();
            this.form.get('precio')?.updateValueAndValidity();
          }
        });
        this.cargarEmpleadosEmpresa(empresaId);
      }
      if (clienteIdQuery && !this.pedidoId) {
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
          esEstudianteUtpl: pedido.esEstudianteUtpl ?? false,
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
              this.form.get('precio')?.clearValidators();
              this.form.get('precio')?.updateValueAndValidity();
            }
          });
          this.cargarEmpleadosEmpresa(pedido.pedidoEmpresaId);
        }
      });
    });
    // Recalcular descuento, total y saldo cada vez que cambie precio, abono
    // o la condición de estudiante UTPL.
    this.form
      .get('precio')
      ?.valueChanges.subscribe(() => this.actualizarSaldo());
    this.form
      .get('abono')
      ?.valueChanges.subscribe(() => this.actualizarSaldo());
    this.form
      .get('esEstudianteUtpl')
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

  /**
   * Recalcula el descuento UTPL, el total a pagar y el saldo.
   * El saldo se redondea a 2 decimales hacia el inmediato superior.
   */
  actualizarSaldo() {
    const abono = Number(this.form.get('abono')?.value ?? 0);
    const { descuento, total } = calcularTotales(
      this.form.get('precio')?.value,
      !!this.form.get('esEstudianteUtpl')?.value,
    );
    this.descuento = descuento;
    this.total = total;
    this.form
      .get('saldo')
      ?.setValue(redondearArriba2(total - abono) as any, { emitEvent: false });
  }

  formatearMoneda(valor: number | null | undefined): string {
    return formatMoneda(valor);
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
    if (this.guardando) return;
    this.clienteDuplicado =
      !!this.empresaContexto &&
      !!this.clienteSeleccionado &&
      this.clientesYaEnEmpresa.has(this.clienteSeleccionado.id);
  }

  crearCliente() {
    const queryParams: { empresaId?: string } = {};
    if (this.empresaContexto) {
      queryParams.empresaId = this.empresaContexto.id;
    }
    this.router.navigate(['/clientes/nuevo'], { queryParams });
  }

  prepararWhatsApp(
    pedido: Partial<import('../models/pedido.model').Pedido>,
    numeroOrden = '',
  ) {
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
      numeroOrden ? `- N° de orden: ${numeroOrden}` : '',
      pedido.descripcion ? `- Descripción: ${pedido.descripcion}` : '',
      pedido.cantidadTernos ? `- Cantidad de ternos: ${pedido.cantidadTernos}` : '',
      pedido.fechaEntrega ? `- Fecha de entrega: ${pedido.fechaEntrega}` : '',
      pedido.precio != null ? `- Precio: $${formatMoneda(pedido.precio)}` : '',
      pedido.descuento != null && pedido.descuento > 0
        ? `- Descuento estudiante UTPL (${this.porcentajeUtpl}%): -$${formatMoneda(pedido.descuento)}`
        : '',
      pedido.descuento != null && pedido.descuento > 0 && pedido.total != null
        ? `- Total a pagar: $${formatMoneda(pedido.total)}`
        : '',
      pedido.abono != null ? `- Abono: $${formatMoneda(pedido.abono)}` : '',
      pedido.saldo != null ? `- Saldo pendiente: $${formatMoneda(pedido.saldo)}` : '',
      '',
      pedido.abono != null && pedido.abono > 0
        ? '*Nota:* El abono no es reembolsable. Si en algún momento decide no continuar con este pedido, su valor queda registrado a su favor y podrá usarlo en la confección de otra prenda cuando usted lo desee.'
        : '',
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

  hasError(controlName: string): boolean {
    const ctrl = this.form.get(controlName);
    if (!ctrl) return false;
    return ctrl.invalid && (this.submitted || ctrl.touched);
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid || !this.clienteSeleccionado) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.clienteDuplicado) return;
    if (this.form.valid && this.clienteSeleccionado && !this.guardando) {
      this.guardando = true;
      const formValue = this.form.value;
      const tienePrecio = formValue.precio != null && (formValue.precio as unknown) !== '';
      const pedido: Partial<import('../models/pedido.model').Pedido> = {
        clienteId: this.clienteSeleccionado!.id,
        descripcion: formValue.descripcion ?? '',
        estado: formValue.estado as 'pendiente' | 'en_proceso' | 'terminado' | 'entregado' | undefined,
        precio: tienePrecio ? redondearArriba2(formValue.precio) : undefined,
        esEstudianteUtpl: !!formValue.esEstudianteUtpl,
        descuento: tienePrecio ? this.descuento : undefined,
        total: tienePrecio ? this.total : undefined,
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
      const afterSave = (numeroOrden = '') => {
        if (this.empresaContexto) {
          this.router.navigate(['/pedidos-empresa', this.empresaContexto.id]);
        } else {
          this.prepararWhatsApp(pedido, numeroOrden);
        }
      };
      if (this.pedidoId) {
        this.pedidosService
          .updatePedido(this.pedidoId, pedido)
          .then(() => afterSave(this.pedidoId ?? ''))
          .finally(finalizar);
      } else {
        this.pedidosService
          .addPedido(pedido)
          .then((ref) => afterSave(ref?.id ?? ''))
          .finally(finalizar);
      }
    }
  }
}
