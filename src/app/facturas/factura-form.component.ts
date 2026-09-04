import { CommonModule } from '@angular/common'
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core'
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ClientesService } from '../clientes/clientes.service'
import { FacturasService } from './facturas.service'
import { DatosFacturacionService } from './datos-facturacion.service'
import { Cliente } from '../models/cliente.model'
import { Pedido } from '../models/pedido.model'
import { DatoFacturacion } from '../models/dato-facturacion.model'
import { formatMoneda, redondearArriba2, totalPedido } from '../shared/money.util'
import { matchesSearch } from '../shared/search.util'

@Component({
  standalone: true,
  selector: 'app-factura-form',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal fade" [class.show]="visible" [style.display]="visible ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="fa-solid fa-file-invoice-dollar me-2"></i>
              {{ sinPedido ? 'Nueva factura (sin pedido)' : 'Crear Factura' }}
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="cerrar()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form" (ngSubmit)="guardarFactura()">
              <!-- Info del Pedido -->
              <div class="alert alert-info" *ngIf="pedido && !sinPedido">
                <strong>N° de orden:</strong> {{ pedido.id }}<br>
                <strong>Cantidad de ternos:</strong> {{ pedido.cantidadTernos }}<br>
                <strong>Fecha de entrega:</strong> {{ pedido.fechaEntrega }}<br>
                <strong>Precio:</strong> \${{ money(pedido.precio) }}
                <span *ngIf="pedido.descuento && pedido.descuento > 0">
                  <br><strong>Descuento estudiante UTPL:</strong> -\${{ money(pedido.descuento) }}
                </span>
                <br><strong>Valor Total:</strong> \${{ money(valorTotalPedido) }}
              </div>

              <!-- Datos de la factura manual (sin pedido asociado) -->
              <div class="card mb-3" *ngIf="sinPedido">
                <div class="card-header bg-light">
                  <h6 class="mb-0"><i class="fa-solid fa-clipboard-list me-2"></i>Detalle de la factura</h6>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <label class="form-label"><strong>Detalle *</strong></label>
                    <textarea
                      class="form-control"
                      rows="4"
                      placeholder="Describe los productos o servicios a facturar..."
                      formControlName="detallePedido"></textarea>
                    <div class="text-danger small mt-1" *ngIf="getFieldError('detallePedido')">
                      {{ getFieldError('detallePedido') }}
                    </div>
                  </div>
                  <div class="row g-2">
                    <div class="col-6">
                      <label class="form-label"><strong>Valor Total *</strong></label>
                      <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          class="form-control"
                          placeholder="0.00"
                          formControlName="valorTotal">
                      </div>
                      <div class="text-danger small mt-1" *ngIf="getFieldError('valorTotal')">
                        {{ getFieldError('valorTotal') }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Selección de datos del cliente -->
              <div class="mb-3">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="usarDatosCliente"
                    id="usarDatos"
                    [value]="true"
                    (change)="cambiarTipoDatos(true)"
                    formControlName="usarDatosCliente">
                  <label class="form-check-label" for="usarDatos">
                    Usar datos del cliente registrado
                  </label>
                </div>
              </div>

              <!-- Buscador de cliente registrado (solo en facturas sin pedido) -->
              <div *ngIf="usarDatosCliente && sinPedido" class="mb-3">
                <label class="form-label"><strong>Buscar cliente registrado</strong></label>
                <div class="input-group">
                  <span class="input-group-text"><i class="fa-solid fa-search"></i></span>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Buscar por nombre o apellido..."
                    [(ngModel)]="busquedaCliente"
                    [ngModelOptions]="{ standalone: true }"
                    (input)="buscarClientes()">
                </div>
                <ul class="list-group mt-1" *ngIf="resultadosClientes.length > 0" style="max-height: 180px; overflow-y: auto;">
                  <li
                    class="list-group-item list-group-item-action"
                    role="button"
                    *ngFor="let c of resultadosClientes"
                    (click)="seleccionarCliente(c)">
                    <strong>{{ c.nombreCompleto }} {{ c.apellidos }}</strong>
                    <div class="small text-muted" *ngIf="c.telefono">{{ c.telefono }}</div>
                  </li>
                </ul>
                <div class="form-text" *ngIf="!cliente">Selecciona un cliente para continuar.</div>
              </div>

              <!-- Datos cliente existente -->
              <div *ngIf="usarDatosCliente && cliente" class="card mb-3">
                <div class="card-body">
                  <p class="mb-2">
                    <strong>{{ cliente.nombreCompleto }} {{ cliente.apellidos }}</strong><br>
                    <small class="text-muted">{{ cliente.telefono }}</small>
                  </p>
                  <div class="row g-2">
                    <div class="col-12">
                      <label class="form-label"><strong>Dirección *</strong></label>
                      <input
                        type="text"
                        class="form-control"
                        placeholder="Ingrese la dirección"
                        formControlName="direccion"
                        required>
                      <div class="text-danger small mt-1" *ngIf="getFieldError('direccion')">
                        {{ getFieldError('direccion') }}
                      </div>
                    </div>
                    <div class="col-12">
                      <label class="form-label"><strong>Correo Electrónico *</strong></label>
                      <input
                        type="email"
                        class="form-control"
                        placeholder="correo@ejemplo.com"
                        formControlName="correoElectronico"
                        required>
                      <div class="text-danger small mt-1" *ngIf="getFieldError('correoElectronico')">
                        {{ getFieldError('correoElectronico') }}
                      </div>
                    </div>
                    <div class="col-6">
                      <label class="form-label"><strong>Cédula/RUC *</strong></label>
                      <input
                        type="text"
                        class="form-control"
                        placeholder="1234567890"
                        formControlName="cedula"
                        required>
                      <div class="text-danger small mt-1" *ngIf="getFieldError('cedula')">
                        {{ getFieldError('cedula') }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Otros datos -->
              <div class="mb-3">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="usarDatosCliente"
                    id="otrosDatos"
                    [value]="false"
                    (change)="cambiarTipoDatos(false)"
                    formControlName="usarDatosCliente">
                  <label class="form-check-label" for="otrosDatos">
                    Usar otros datos
                  </label>
                </div>
              </div>

              <!-- Formulario con otros datos -->
              <div *ngIf="!usarDatosCliente" class="card mb-3">
                <div class="card-body">
                  <!-- Buscador de datos guardados anteriormente -->
                  <div class="mb-3">
                    <label class="form-label"><strong>Buscar datos guardados</strong></label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="fa-solid fa-search"></i></span>
                      <input
                        type="text"
                        class="form-control"
                        placeholder="Buscar por nombre, cédula o correo..."
                        [(ngModel)]="busquedaOtrosDatos"
                        [ngModelOptions]="{ standalone: true }"
                        (input)="buscarDatosGuardados()">
                    </div>
                    <ul class="list-group mt-1" *ngIf="resultadosBusqueda.length > 0" style="max-height: 180px; overflow-y: auto;">
                      <li
                        class="list-group-item list-group-item-action"
                        role="button"
                        *ngFor="let d of resultadosBusqueda"
                        (click)="seleccionarDatoGuardado(d)">
                        <strong>{{ d.nombreCompleto }} {{ d.apellidos }}</strong>
                        <div class="small text-muted">
                          <span *ngIf="d.cedula">{{ d.cedula }}</span>
                          <span *ngIf="d.correoElectronico"> · {{ d.correoElectronico }}</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div class="row g-2">
                    <div class="col-6">
                      <label class="form-label"><strong>Nombres Completos *</strong></label>
                      <input
                        type="text"
                        class="form-control"
                        placeholder="Juan"
                        formControlName="nombreCompleto"
                        [required]="!usarDatosCliente">
                      <div class="text-danger small mt-1" *ngIf="getFieldError('nombreCompleto')">
                        {{ getFieldError('nombreCompleto') }}
                      </div>
                    </div>
                    <div class="col-6">
                      <label class="form-label"><strong>Apellidos *</strong></label>
                      <input
                        type="text"
                        class="form-control"
                        placeholder="Pérez"
                        formControlName="apellidos"
                        [required]="!usarDatosCliente">
                      <div class="text-danger small mt-1" *ngIf="getFieldError('apellidos')">
                        {{ getFieldError('apellidos') }}
                      </div>
                    </div>
                    <div class="col-12">
                      <label class="form-label"><strong>Dirección *</strong></label>
                      <input
                        type="text"
                        class="form-control"
                        placeholder="Calle Principal 123"
                        formControlName="direccion"
                        [required]="!usarDatosCliente">
                      <div class="text-danger small mt-1" *ngIf="getFieldError('direccion')">
                        {{ getFieldError('direccion') }}
                      </div>
                    </div>
                    <div class="col-12">
                      <label class="form-label"><strong>Correo Electrónico *</strong></label>
                      <input
                        type="email"
                        class="form-control"
                        placeholder="correo@ejemplo.com"
                        formControlName="correoElectronico"
                        [required]="!usarDatosCliente">
                      <div class="text-danger small mt-1" *ngIf="getFieldError('correoElectronico')">
                        {{ getFieldError('correoElectronico') }}
                      </div>
                    </div>
                    <div class="col-6">
                      <label class="form-label"><strong>Número de Teléfono *</strong></label>
                      <input
                        type="tel"
                        class="form-control"
                        placeholder="0999999999"
                        formControlName="numeroCelular"
                        [required]="!usarDatosCliente">
                      <div class="text-danger small mt-1" *ngIf="getFieldError('numeroCelular')">
                        {{ getFieldError('numeroCelular') }}
                      </div>
                    </div>
                    <div class="col-6">
                      <label class="form-label"><strong>Cédula/RUC *</strong></label>
                      <input
                        type="text"
                        class="form-control"
                        placeholder="1234567890"
                        formControlName="cedula"
                        [required]="!usarDatosCliente">
                      <div class="text-danger small mt-1" *ngIf="getFieldError('cedula')">
                        {{ getFieldError('cedula') }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Observaciones -->
              <div class="mb-3">
                <label class="form-label"><strong>Observaciones</strong></label>
                <textarea
                  class="form-control"
                  rows="3"
                  placeholder="Notas adicionales para la factura..."
                  formControlName="observaciones"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cerrar()">Cancelar</button>
            <button
              type="button"
              class="btn btn-primary"
              (click)="guardarFactura()"
              [disabled]="!form.valid || guardando || !puedeGuardar">
              <span *ngIf="!guardando">
                <i class="fa-solid fa-save me-1"></i> Crear Factura
              </span>
              <span *ngIf="guardando">
                <span class="spinner-border spinner-border-sm me-2"></span> Guardando...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="visible"></div>
  `,
})
export class FacturaFormComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() pedido: Pedido | null | undefined = null;
  @Input() cliente: Cliente | null | undefined = null;
  /** Factura creada manualmente, sin un pedido registrado asociado. */
  @Input() sinPedido = false;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() facturaCreada = new EventEmitter<any>();

  form!: FormGroup;
  usarDatosCliente = true;
  guardando = false;

  busquedaOtrosDatos = '';
  datosGuardados: DatoFacturacion[] = [];
  resultadosBusqueda: DatoFacturacion[] = [];

  busquedaCliente = '';
  clientesRegistrados: Cliente[] = [];
  resultadosClientes: Cliente[] = [];

  /** Total a pagar del pedido asociado (ya con el descuento UTPL si aplica). */
  get valorTotalPedido(): number {
    return totalPedido(this.pedido);
  }

  /**
   * En una factura sin pedido, si se eligió "datos del cliente registrado"
   * hace falta seleccionar primero un cliente.
   */
  get puedeGuardar(): boolean {
    if (!this.sinPedido) return !!this.pedido && !!this.cliente;
    return !this.usarDatosCliente || !!this.cliente;
  }

  constructor(
    private fb: FormBuilder,
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private datosFacturacionService: DatosFacturacionService,
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
    this.aplicarValidadoresSinPedido();
    this.prefillDesdeCliente();
    this.datosFacturacionService.getDatosFacturacion().subscribe((datos) => {
      this.datosGuardados = datos;
    });
    this.clientesService.getClientes().subscribe((clientes) => {
      this.clientesRegistrados = clientes;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.form) return;
    if (changes['sinPedido']) {
      this.aplicarValidadoresSinPedido();
    }
    // Al abrir una factura sin pedido se parte siempre de un formulario limpio.
    if (changes['visible'] && this.visible && this.sinPedido) {
      this.reiniciarFacturaManual();
    }
    // El cliente llega de forma asíncrona; cuando esté disponible, rellenar sus datos guardados.
    if (changes['cliente'] && this.cliente) {
      this.prefillDesdeCliente();
    }
  }

  /** Detalle y valor total solo son obligatorios en las facturas sin pedido. */
  private aplicarValidadoresSinPedido() {
    const detalle = this.form.get('detallePedido');
    const valor = this.form.get('valorTotal');
    if (this.sinPedido) {
      detalle?.setValidators([Validators.required]);
      valor?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      detalle?.clearValidators();
      valor?.clearValidators();
    }
    detalle?.updateValueAndValidity();
    valor?.updateValueAndValidity();
  }

  private reiniciarFacturaManual() {
    this.cliente = null;
    this.busquedaCliente = '';
    this.resultadosClientes = [];
    this.busquedaOtrosDatos = '';
    this.resultadosBusqueda = [];
    this.usarDatosCliente = true;
    this.form.reset({
      usarDatosCliente: true,
      nombreCompleto: '',
      apellidos: '',
      direccion: '',
      correoElectronico: '',
      numeroCelular: '',
      cedula: '',
      ruc: '',
      detallePedido: '',
      valorTotal: null,
      observaciones: '',
    });
    // Restablece los validadores al estado de "datos del cliente registrado".
    this.cambiarTipoDatos(true);
  }

  private inicializarFormulario() {
    this.form = this.fb.group({
      usarDatosCliente: [true],
      nombreCompleto: [''],
      apellidos: [''],
      direccion: ['', Validators.required],
      correoElectronico: ['', [Validators.required, Validators.email]],
      numeroCelular: [''],
      cedula: ['', Validators.required],
      ruc: [''],
      detallePedido: [''],
      valorTotal: [null as number | null],
      observaciones: [''],
    });
  }

  /** Rellena el formulario con los datos de facturación guardados en el cliente. */
  private prefillDesdeCliente() {
    const cliente = this.cliente;
    if (!cliente || !this.form || !this.usarDatosCliente) return;
    this.form.patchValue({
      direccion: cliente.direccion ?? '',
      correoElectronico: cliente.correoElectronico ?? '',
      cedula: cliente.cedula ?? '',
    });
  }

  money(valor: number | null | undefined): string {
    return formatMoneda(valor);
  }

  buscarClientes() {
    const termino = this.busquedaCliente.trim();
    if (!termino) {
      this.resultadosClientes = [];
      return;
    }
    this.resultadosClientes = this.clientesRegistrados
      .filter((c) => matchesSearch(`${c.nombreCompleto} ${c.apellidos}`, termino))
      .slice(0, 8);
  }

  seleccionarCliente(cliente: Cliente) {
    this.cliente = cliente;
    this.busquedaCliente = `${cliente.nombreCompleto} ${cliente.apellidos}`;
    this.resultadosClientes = [];
    this.prefillDesdeCliente();
  }

  buscarDatosGuardados() {
    const termino = this.busquedaOtrosDatos.trim();
    if (!termino) {
      this.resultadosBusqueda = [];
      return;
    }
    this.resultadosBusqueda = this.datosGuardados
      .filter((d) => matchesSearch(`${d.nombreCompleto} ${d.apellidos} ${d.cedula} ${d.correoElectronico}`, termino))
      .slice(0, 8);
  }

  seleccionarDatoGuardado(dato: DatoFacturacion) {
    this.form.patchValue({
      nombreCompleto: dato.nombreCompleto,
      apellidos: dato.apellidos,
      direccion: dato.direccion,
      correoElectronico: dato.correoElectronico,
      numeroCelular: dato.numeroCelular,
      cedula: dato.cedula,
      ruc: dato.ruc ?? '',
    });
    this.busquedaOtrosDatos = '';
    this.resultadosBusqueda = [];
  }

  cambiarTipoDatos(usarDatos: boolean) {
    this.usarDatosCliente = usarDatos;
    const nombreControl = this.form.get('nombreCompleto');
    const apellidosControl = this.form.get('apellidos');
    const celularControl = this.form.get('numeroCelular');

    if (usarDatos) {
      // Deben limpiarse los validadores síncronos: son los que marcan estos
      // campos como requeridos al elegir "otros datos".
      nombreControl?.clearValidators();
      apellidosControl?.clearValidators();
      celularControl?.clearValidators();
      // Volver a los datos del cliente registrado.
      this.prefillDesdeCliente();
    } else {
      nombreControl?.setValidators([Validators.required]);
      apellidosControl?.setValidators([Validators.required]);
      celularControl?.setValidators([Validators.required]);
      // Dejar todos los campos en blanco hasta que se busque/elija o se llenen manualmente.
      this.form.patchValue({
        nombreCompleto: '',
        apellidos: '',
        direccion: '',
        correoElectronico: '',
        numeroCelular: '',
        cedula: '',
        ruc: '',
      });
      this.busquedaOtrosDatos = '';
      this.resultadosBusqueda = [];
      // En una factura sin pedido el cliente se elige aquí mismo: al pasar a
      // "otros datos" se descarta la selección previa.
      if (this.sinPedido) {
        this.cliente = null;
        this.busquedaCliente = '';
        this.resultadosClientes = [];
      }
    }

    nombreControl?.updateValueAndValidity();
    apellidosControl?.updateValueAndValidity();
    celularControl?.updateValueAndValidity();
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (field?.hasError('email')) {
      return 'Correo electrónico inválido';
    }
    return null;
  }

  async guardarFactura() {
    if (!this.form.valid || !this.puedeGuardar) {
      return;
    }

    const pedido = this.pedido as Pedido | null;
    const cliente = this.cliente as Cliente | null;

    if (!this.sinPedido && (!pedido || !cliente)) {
      return;
    }

    this.guardando = true;
    try {
      const formValue = this.form.value;
      const datosCliente = {
        usarDatosCliente: this.usarDatosCliente,
        nombreCompleto: this.usarDatosCliente ? cliente?.nombreCompleto : formValue.nombreCompleto,
        apellidos: this.usarDatosCliente ? cliente?.apellidos : formValue.apellidos,
        direccion: formValue.direccion,
        correoElectronico: formValue.correoElectronico,
        numeroCelular: this.usarDatosCliente ? cliente?.telefono : formValue.numeroCelular,
        cedula: formValue.cedula,
        ruc: formValue.ruc,
      };

      const factura = this.sinPedido
        ? {
            pedidoId: '',
            clienteId: cliente?.id ?? '',
            sinPedido: true,
            datosCliente,
            detallePedido: (formValue.detallePedido ?? '').trim(),
            valorTotal: redondearArriba2(formValue.valorTotal),
            estado: 'pendiente',
            observaciones: formValue.observaciones,
          }
        : {
            pedidoId: pedido!.id,
            clienteId: cliente!.id,
            sinPedido: false,
            datosCliente,
            detallePedido: this.construirDetallePedido(pedido!),
            valorTotal: totalPedido(pedido),
            estado: 'pendiente',
            observaciones: formValue.observaciones,
          };

      await this.facturasService.addFactura(factura);
      await this.persistirDatosFacturacion(cliente, formValue);
      this.facturaCreada.emit(factura);
      this.cerrar();
    } catch (error) {
      console.error('Error al crear factura:', error);
      alert('Error al crear la factura');
    } finally {
      this.guardando = false;
    }
  }

  /**
   * Guarda los datos usados para reutilizarlos en el futuro:
   * - Datos del cliente registrado -> se guardan asociados al cliente.
   * - Otros datos -> se guardan en la colección de contactos de facturación.
   */
  private async persistirDatosFacturacion(cliente: Cliente | null, formValue: any) {
    try {
      if (this.usarDatosCliente && cliente) {
        await this.clientesService.updateCliente(cliente.id, {
          direccion: formValue.direccion,
          correoElectronico: formValue.correoElectronico,
          cedula: formValue.cedula,
        });
      } else {
        await this.datosFacturacionService.guardarDato({
          nombreCompleto: formValue.nombreCompleto,
          apellidos: formValue.apellidos,
          direccion: formValue.direccion,
          correoElectronico: formValue.correoElectronico,
          numeroCelular: formValue.numeroCelular,
          cedula: formValue.cedula,
          ruc: formValue.ruc,
        });
      }
    } catch (error) {
      // No bloquear la creación de la factura si falla el guardado de datos reutilizables.
      console.error('No se pudieron guardar los datos de facturación para reutilizar:', error);
    }
  }

  private construirDetallePedido(pedido: Pedido): string {
    return `
    N° de orden: ${pedido.id}
    Cantidad de ternos: ${pedido.cantidadTernos}
    Descripción: ${pedido.descripcion}
    Fecha de entrega: ${pedido.fechaEntrega}
    ${pedido.descuento ? `Descuento estudiante UTPL: -$${formatMoneda(pedido.descuento)}` : ''}
    ${pedido.notas ? `Notas: ${pedido.notas}` : ''}
    `.trim();
  }

  cerrar() {
    this.cerrarModal.emit();
  }
}
