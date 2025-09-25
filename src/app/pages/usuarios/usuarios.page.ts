import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, Component, EnvironmentInjector, inject, OnInit, runInInjectionContext } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Observable } from 'rxjs';
import { User } from 'src/app/interfaces/user';
import { FirestoreService } from 'src/app/services/firestore';
@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  imports: [
    IonicModule, AsyncPipe
  ],
  standalone: true
})
export class UsuariosPage implements OnInit {

  users: User[] = [];
  users$!: Observable<User[]>
  
  private readonly injector = inject(EnvironmentInjector);

  tittle = 'Usuarios';
  async goToForm() {
    this.r.navigate(['form'], { relativeTo: this.route });
  }
  async goToAppointment() {
    this.r.navigate(['appointment'], { relativeTo: this.route });
  }
  async goToSchedule() {
    this.r.navigate(['horarios']);
  }
  async goToEdit(id:User['id']) {
    this.r.navigate([`form/${id}`], { relativeTo: this.route });
  }
  constructor(
    private firestore: FirestoreService,
    private r: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef

  ) {

  }
   
  ngOnInit() {
    runInInjectionContext(this.injector, () => {
      this.users$ = this.firestore.getUsers();
        this.cdr.detectChanges();
        console.log(this.users$);
    });
  }
}



