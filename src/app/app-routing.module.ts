import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'usuarios',
    loadChildren: () => import('./pages/usuarios/usuarios.module').then(m => m.UsuariosPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'usuarios',
    pathMatch: 'full'
  },
  {
    path: 'createUser',
    loadChildren: () => import('./users/create-user/create-user-module').then(m => m.CreateUserPageModule)
  },
  {
    path: 'servicios',
    loadChildren: () => import('./pages/servicios/servicios.module').then(m => m.ServiciosPageModule)
  },
  {
    path: 'horarios',
    loadChildren: () => import('./pages/horarios/horarios.module').then(m => m.HorariosPageModule)
  },
  {
    path: 'citas',
    loadChildren: () => import('./pages/citas/citas.module').then(m => m.CitasPageModule)
  },
  {
    path: 'appointment',
    loadChildren: () => import('./pages/appointment/appointment.module').then(m => m.AppointmentPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
