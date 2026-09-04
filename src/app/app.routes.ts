import { Routes } from '@angular/router'
import { canActivateAuthGuard } from './auth/auth.guard'

export const routes: Routes = [
	{
		path: 'auth/login',
		loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent)
	},
	{
		path: '',
		redirectTo: 'pedidos',
		pathMatch: 'full'
	},
	{
		path: 'clientes',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./clientes/clientes-list.component').then(m => m.ClientesListComponent)
	},
	{
		path: 'clientes/nuevo',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./clientes/cliente-form.component').then(m => m.ClienteFormComponent)
	},
	{
		path: 'clientes/editar/:id',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./clientes/cliente-form.component').then(m => m.ClienteFormComponent)
	},
	{
		path: 'clientes/:id/medidas',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./medidas/medidas-form.component').then(m => m.MedidasFormComponent)
	},
	{
		path: 'pedidos',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./pedidos/pedidos-list.component').then(m => m.PedidosListComponent)
	},
	{
		path: 'pedidos/nuevo',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./pedidos/pedido-form.component').then(m => m.PedidoFormComponent)
	},
	{
		path: 'pedidos/:id',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./pedidos/pedido-detail.component').then(m => m.PedidoDetailComponent)
	},
	{
		path: 'pedidos/editar/:id',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./pedidos/pedido-form.component').then(m => m.PedidoFormComponent)
	},
	{
		path: 'pedidos-empresa',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./pedidos-empresa/pedidos-empresa-list.component').then(m => m.PedidosEmpresaListComponent)
	},
	{
		path: 'pedidos-empresa/nuevo',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./pedidos-empresa/pedido-empresa-form.component').then(m => m.PedidoEmpresaFormComponent)
	},
	{
		path: 'pedidos-empresa/editar/:id',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./pedidos-empresa/pedido-empresa-form.component').then(m => m.PedidoEmpresaFormComponent)
	},
	{
		path: 'pedidos-empresa/:id',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./pedidos-empresa/pedido-empresa-detail.component').then(m => m.PedidoEmpresaDetailComponent)
	},
	{
		path: 'resumen',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./resumen/resumen.component').then(m => m.ResumenComponent)
	},
	{
		path: 'facturas',
		canActivate: [canActivateAuthGuard],
		loadComponent: () => import('./facturas/facturas-list.component').then(m => m.FacturasListComponent)
	},
	{
		path: '**',
		redirectTo: 'pedidos'
	}

];
