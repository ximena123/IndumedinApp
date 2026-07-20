import { CommonModule } from '@angular/common'
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ClientesService } from '../clientes/clientes.service'
import { PedidosService } from '../pedidos/pedidos.service'
import { FacturasService } from './facturas.service'
import { Cliente } from '../models/cliente.model'
import { Pedido } from '../models/pedido.model'
import { Observable, switchMap } from 'rxjs'

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
              <i class="fa-solid fa-file-invoice-dollar me-2"></i> Crear Factura
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="cerrar()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form" (ngSubmit)="guardarFactura()">
              <!-- Info del Pedido -->
              <div class="alert alert-info" *ngIf="pedido">
                <strong>Pedido ID:</strong> {{ pedido.id }}<br>
                <strong>Cantidad de ternos:</strong> {{ pedido.cantidadTernos }}<br>
                <strong>Fecha de entrega:</strong> {{ pedido.fechaEntrega }}<br>
                <strong>Valor Total:</strong> \${{ pedido.precio || 0 }}
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
              [disabled]="!form.valid || guardando">
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
export class FacturaFormComponent implements OnInit {
  @Input() visible = false;
  @Input() pedido: Pedido | null | undefined = null;
  @Input() cliente: Cliente | null | undefined = null;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() facturaCreada = new EventEmitter<any>();

  form!: FormGroup;
  usarDatosCliente = true;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private facturasService: FacturasService,
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
    this.cargarDatosGuardados();
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
      observaciones: [''],
    });
  }

  private cargarDatosGuardados() {
    const datosGuardados = localStorage.getItem('datosFacturaCliente');
    if (datosGuardados) {
      try {
        const datos = JSON.parse(datosGuardados);
        this.form.patchValue(datos);
      } catch (e) {
        console.error('Error al cargar datos guardados:', e);
      }
    }
  }

  private guardarDatos() {
    const datosAGuardar = {
      usarDatosCliente: this.form.value.usarDatosCliente,
      direccion: this.form.value.direccion,
      correoElectronico: this.form.value.correoElectronico,
      numeroCelular: this.form.value.numeroCelular,
      cedula: this.form.value.cedula,
      ruc: this.form.value.ruc,
    };
    localStorage.setItem('datosFacturaCliente', JSON.stringify(datosAGuardar));
  }

  cambiarTipoDatos(usarDatos: boolean) {
    this.usarDatosCliente = usarDatos;
    const nombreControl = this.form.get('nombreCompleto');
    const apellidosControl = this.form.get('apellidos');
    const celularControl = this.form.get('numeroCelular');

    if (usarDatos) {
      nombreControl?.clearAsyncValidators();
      apellidosControl?.clearAsyncValidators();
      celularControl?.clearAsyncValidators();
    } else {
      nombreControl?.setValidators([Validators.required]);
      apellidosControl?.setValidators([Validators.required]);
      celularControl?.setValidators([Validators.required]);
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
    if (!this.form.valid) {
      return;
    }

    const pedido = this.pedido as Pedido | null;
    const cliente = this.cliente as Cliente | null;

    if (!pedido || !cliente) {
      return;
    }

    this.guardando = true;
    try {
      const formValue = this.form.value;
      const datosCliente = {
        usarDatosCliente: this.usarDatosCliente,
        nombreCompleto: this.usarDatosCliente ? cliente.nombreCompleto : formValue.nombreCompleto,
        apellidos: this.usarDatosCliente ? cliente.apellidos : formValue.apellidos,
        direccion: formValue.direccion,
        correoElectronico: formValue.correoElectronico,
        numeroCelular: this.usarDatosCliente ? cliente.telefono : formValue.numeroCelular,
        cedula: formValue.cedula,
        ruc: formValue.ruc,
      };

      const factura = {
        pedidoId: pedido.id,
        clienteId: cliente.id,
        datosCliente,
        detallePedido: this.construirDetallePedido(pedido),
        valorTotal: pedido.precio || 0,
        estado: 'pendiente',
        observaciones: formValue.observaciones,
      };

      await this.facturasService.addFactura(factura);
      this.guardarDatos();
      this.facturaCreada.emit(factura);
      this.cerrar();
    } catch (error) {
      console.error('Error al crear factura:', error);
      alert('Error al crear la factura');
    } finally {
      this.guardando = false;
    }
  }

  private construirDetallePedido(pedido: Pedido): string {
    return `
    Cantidad de ternos: ${pedido.cantidadTernos}
    Descripción: ${pedido.descripcion}
    Fecha de entrega: ${pedido.fechaEntrega}
    ${pedido.notas ? `Notas: ${pedido.notas}` : ''}
    `.trim();
  }

  cerrar() {
    this.cerrarModal.emit();
  }
}
