import { ChangeDetectorRef, Component, EnvironmentInjector, inject, OnInit, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FirestoreService } from 'src/app/services/firestore';
import { AppointmentModel } from 'src/app/interfaces/appointment-model';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointment.page.html',
  styleUrls: ['./appointment.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AppointmentsPage implements OnInit {

  appointments: AppointmentModel[] = [];
  appointments$!: Observable<AppointmentModel[]>

  private readonly injector = inject(EnvironmentInjector);

  constructor(
    private afs: FirestoreService,
    private r: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  async goToAppointmentForm() {
    this.r.navigate(['form'], { relativeTo: this.route });
  }
  async goToEdit(id:AppointmentModel['id']){
    this.r.navigate([`form/${id}`], {relativeTo: this.route});
  }

  ngOnInit() {

    runInInjectionContext(this.injector, () => {
      const injec = inject(FirestoreService)
      this.appointments$ = injec.appointments$;
      this.cdr.detectChanges();

      console.log('Citas obtenidas:', injec.appointments$);
      console.log('injec:', injec);
    });

    this.cdr.detectChanges();
    console.log(this.appointments$);
  }
}
