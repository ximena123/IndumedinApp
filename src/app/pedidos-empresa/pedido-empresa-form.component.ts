import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { firstValueFrom } from 'rxjs'
import { EstadoPedidoEmpresa, PedidoEmpresa } from '../models/pedido-empresa.model'
import { PedidosService } from '../pedidos/pedidos.service'
import { PedidosEmpresaService } from './pedidos-empresa.service'

@Component({
  standalone: true,
  selector: 'app-pedido-empresa-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Modal WhatsApp -->
    <div class="modal fade" [class.show]="mostrarModalWhatsApp" [style.display]="mostrarModalWhatsApp ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="fa-brands fa-whatsapp me-2"></i>Enviar WhatsApp al responsable</h5>
          </div>
          <div class="modal-body">
            <p class="mb-2">Se enviará el siguiente mensaje a <strong>{{ form.value.responsable }}</strong>:</p>
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
      {{ pedidoEmpresaId ? 'Editar Pedido de Empresa' : 'Nuevo Pedido de Empresa' }}
    </h2>
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="row mb-3">
            <div class="col-md-6 mb-2">
              <label class="form-label">Nombre de la empresa <span class="text-danger">*</span></label>
              <input
                formControlName="nombreEmpresa"
                type="text"
                class="form-control"
                placeholder="Ej. Hospital del Río"
                [class.is-invalid]="hasError('nombreEmpresa')"
              />
              <div class="invalid-feedback" *ngIf="hasError('nombreEmpresa')">El nombre de la empresa es requerido.</div>
            </div>
            <div class="col-md-3 mb-2">
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
            <div class="col-md-3 mb-2">
              <label class="form-label">Estado</label>
              <select formControlName="estado" class="form-control">
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="terminado">Terminado</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-6 mb-2">
              <label class="form-label">Responsable <span class="text-danger">*</span></label>
              <input
                formControlName="responsable"
                type="text"
                class="form-control"
                placeholder="Nombre del responsable"
                [class.is-invalid]="hasError('responsable')"
              />
              <div class="invalid-feedback" *ngIf="hasError('responsable')">El responsable es requerido.</div>
            </div>
            <div class="col-md-6 mb-2">
              <label class="form-label">Teléfono del responsable <span class="text-danger">*</span></label>
              <input
                formControlName="telefonoResponsable"
                type="tel"
                class="form-control"
                placeholder="0999999999"
                [class.is-invalid]="hasError('telefonoResponsable')"
              />
              <div class="invalid-feedback" *ngIf="hasError('telefonoResponsable')">El teléfono es requerido.</div>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Descripción del pedido <span class="text-danger">*</span></label>
            <textarea
              formControlName="descripcion"
              class="form-control"
              rows="3"
              placeholder="Describe el pedido general de la empresa"
              [class.is-invalid]="hasError('descripcion')"
            ></textarea>
            <div class="invalid-feedback" *ngIf="hasError('descripcion')">La descripción es requerida.</div>
          </div>

          <div class="row mb-3">
            <div class="col-md-4 mb-2">
              <label class="form-label">Total global</label>
              <input
                formControlName="total"
                type="number"
                min="0"
                class="form-control"
                placeholder="Total (opcional)"
              />
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label">Abono global</label>
              <input
                formControlName="abono"
                type="number"
                min="0"
                class="form-control"
                placeholder="Abono (opcional)"
              />
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label">Saldo global</label>
              <input
                formControlName="saldo"
                type="number"
                class="form-control"
                placeholder="Saldo (opcional)"
                readonly
              />
            </div>
          </div>

          <div *ngIf="submitted && form.invalid" class="alert alert-warning mb-3">
            <i class="fa-solid fa-triangle-exclamation me-1"></i>
            Por favor completa los campos requeridos marcados en rojo.
          </div>

          <div class="d-flex justify-content-end gap-2 mt-3">
            <button type="button" class="btn btn-outline-secondary px-4" (click)="cancelar()" [disabled]="guardando">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success px-5" [disabled]="guardando">
              <span *ngIf="guardando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class PedidoEmpresaFormComponent implements OnInit {
  guardando = false;
  submitted = false;
  pedidoEmpresaId: string | null = null;
  hoy = new Date().toISOString().slice(0, 10);
  mostrarModalWhatsApp = false;
  mensajeWhatsApp = '';
  whatsAppUrl = '';
  private redireccionDestino: string[] = ['/pedidos-empresa'];

  form = this.fb.group({
    nombreEmpresa: ['', Validators.required],
    responsable: ['', Validators.required],
    telefonoResponsable: ['', Validators.required],
    descripcion: ['', Validators.required],
    fechaEntrega: ['', Validators.required],
    estado: ['pendiente' as EstadoPedidoEmpresa, Validators.required],
    total: [null as number | null],
    abono: [null as number | null],
    saldo: [null as number | null],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private pedidosEmpresaService: PedidosEmpresaService,
    private pedidosService: PedidosService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.pedidoEmpresaId = id;
      this.pedidosEmpresaService.getPedidoEmpresa(id).subscribe((pe) => {
        if (!pe) return;
        this.form.patchValue({
          nombreEmpresa: pe.nombreEmpresa,
          responsable: pe.responsable,
          telefonoResponsable: pe.telefonoResponsable,
          descripcion: pe.descripcion,
          fechaEntrega: pe.fechaEntrega,
          estado: pe.estado,
          total: pe.total ?? null,
          abono: pe.abono ?? null,
          saldo: pe.saldo ?? null,
        });
      });
    });

    this.form.get('total')?.valueChanges.subscribe(() => this.actualizarSaldoGlobal());
    this.form.get('abono')?.valueChanges.subscribe(() => this.actualizarSaldoGlobal());
  }

  private actualizarSaldoGlobal(): void {
    const total = this.form.get('total')?.value;
    const abono = this.form.get('abono')?.value;
    if (total == null && abono == null) {
      this.form.get('saldo')?.setValue(null, { emitEvent: false });
      return;
    }
    const saldo = Number(total ?? 0) - Number(abono ?? 0);
    this.form.get('saldo')?.setValue(saldo, { emitEvent: false });
  }

  cancelar(): void {
    if (this.pedidoEmpresaId) {
      this.router.navigate(['/pedidos-empresa', this.pedidoEmpresaId]);
    } else {
      this.router.navigate(['/pedidos-empresa']);
    }
  }

  hasError(controlName: string): boolean {
    const ctrl = this.form.get(controlName);
    if (!ctrl) return false;
    return ctrl.invalid && (this.submitted || ctrl.touched);
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.guardando) return;
    this.guardando = true;
    const value = this.form.value;
    const payload: Partial<PedidoEmpresa> = {
      nombreEmpresa: value.nombreEmpresa ?? '',
      responsable: value.responsable ?? '',
      telefonoResponsable: value.telefonoResponsable ?? '',
      descripcion: value.descripcion ?? '',
      fechaEntrega: value.fechaEntrega ?? '',
      estado: (value.estado ?? 'pendiente') as EstadoPedidoEmpresa,
    };
    if (value.total != null && value.total !== ('' as unknown as number)) {
      payload.total = Number(value.total);
    }
    if (value.abono != null && value.abono !== ('' as unknown as number)) {
      payload.abono = Number(value.abono);
    }
    if (value.saldo != null && value.saldo !== ('' as unknown as number)) {
      payload.saldo = Number(value.saldo);
    }
    try {
      let empresaId: string;
      if (this.pedidoEmpresaId) {
        await this.pedidosEmpresaService.updatePedidoEmpresa(this.pedidoEmpresaId, payload);
        empresaId = this.pedidoEmpresaId;
      } else {
        const ref = await this.pedidosEmpresaService.addPedidoEmpresa(payload);
        empresaId = ref.id;
      }
      this.redireccionDestino = ['/pedidos-empresa', empresaId];
      await this.prepararWhatsApp(empresaId, payload);
    } finally {
      this.guardando = false;
    }
  }

  private async prepararWhatsApp(empresaId: string, payload: Partial<PedidoEmpresa>): Promise<void> {
    const telefonoRaw = payload.telefonoResponsable ?? '';
    if (!telefonoRaw) {
      this.router.navigate(this.redireccionDestino);
      return;
    }
    let telefono = telefonoRaw.replace(/\D/g, '');
    if (telefono.startsWith('0')) {
      telefono = '593' + telefono.substring(1);
    } else if (!telefono.startsWith('593')) {
      telefono = '593' + telefono;
    }

    const pedidos = await firstValueFrom(this.pedidosService.getPedidosByEmpresa(empresaId));
    const numeroEmpleados = pedidos.length;
    const valorTotal = pedidos.reduce((acc, p) => acc + (p.precio || 0), 0);
    const totalAbonado = pedidos.reduce((acc, p) => acc + (p.abono || 0), 0);
    const saldoPendiente = valorTotal - totalAbonado;

    const lineas = [
      `Hola ${payload.responsable}, el pedido de la empresa *${payload.nombreEmpresa}* ha sido registrado en *Indumedin*.`,
      '',
      `*Detalles del pedido:*`,
      payload.descripcion ? `- Descripción: ${payload.descripcion}` : '',
      payload.fechaEntrega ? `- Fecha de entrega: ${payload.fechaEntrega}` : '',
      numeroEmpleados > 0 ? `- N° de empleados: ${numeroEmpleados}` : '',
      valorTotal > 0 ? `- Valor total: $${valorTotal}` : '',
      totalAbonado > 0 ? `- Total abonado: $${totalAbonado}` : '',
      saldoPendiente > 0 ? `- Saldo pendiente: $${saldoPendiente}` : '',
      '',
      totalAbonado > 0
        ? '*Nota:* El abono no es reembolsable. Si en algún momento deciden no continuar con este pedido, su valor queda registrado a favor de la empresa y podrán usarlo en la confección de otras prendas cuando lo deseen.'
        : '',
      '',
      'Gracias por su preferencia.',
    ];
    this.mensajeWhatsApp = lineas.filter((l) => l !== '').join('\n');
    const texto = encodeURIComponent(this.mensajeWhatsApp);
    const isMobile = /android|iphone|ipad/i.test(navigator.userAgent);
    this.whatsAppUrl = isMobile
      ? `intent://send?phone=${telefono}&text=${texto}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end`
      : `https://web.whatsapp.com/send?phone=${telefono}&text=${texto}`;
    this.mostrarModalWhatsApp = true;
  }

  enviarWhatsApp(): void {
    try {
      const prev = (window as unknown as { __whatsappPopup?: Window | null }).__whatsappPopup;
      if (prev && !prev.closed) {
        prev.close();
      }
    } catch (_) {
      /* ignore */
    }
    (window as unknown as { __whatsappPopup?: Window | null }).__whatsappPopup = window.open(
      this.whatsAppUrl,
      'whatsapp_indumedin',
      'popup,width=1000,height=700',
    );
    this.cerrarModalWhatsApp();
  }

  cerrarModalWhatsApp(): void {
    this.mostrarModalWhatsApp = false;
    this.router.navigate(this.redireccionDestino);
  }
}
