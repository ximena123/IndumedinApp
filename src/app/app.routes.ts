
import { Routes } from '@angular/router'

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'pedidos',
		pathMatch: 'full'
	},
	{
		path: 'clientes',
		loadComponent: () => import('./clientes/clientes-list.component').then(m => m.ClientesListComponent)
	},
	{
		path: 'clientes/nuevo',
		loadComponent: () => import('./clientes/cliente-form.component').then(m => m.ClienteFormComponent)
	},
	{
		path: 'clientes/editar/:id',
		loadComponent: () => import('./clientes/cliente-form.component').then(m => m.ClienteFormComponent)
	},
	{
		path: 'clientes/:id/medidas',
		loadComponent: () => import('./medidas/medidas-form.component').then(m => m.MedidasFormComponent)
	},
	{
		path: 'pedidos',
		loadComponent: () => import('./pedidos/pedidos-list.component').then(m => m.PedidosListComponent)
	},
	{
		path: 'pedidos/nuevo',
		loadComponent: () => import('./pedidos/pedido-form.component').then(m => m.PedidoFormComponent)
	},
	{
		   path: 'pedidos/:id',
		   loadComponent: () => import('./pedidos/pedido-detail.component').then(m => m.PedidoDetailComponent)
	   },
	   {
		   path: 'pedidos/editar/:id',
		   loadComponent: () => import('./pedidos/pedido-form.component').then(m => m.PedidoFormComponent)
	},
		{
		path: 'resumen',
		loadComponent: () => import('./resumen/resumen.component').then(m => m.ResumenComponent)
	},
	{
		path: '**',
		redirectTo: 'clientes'
	}

];
