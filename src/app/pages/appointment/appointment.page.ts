import { ChangeDetectorRef, Component, EnvironmentInjector, inject, OnDestroy, OnInit, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FirestoreService } from 'src/app/services/firestore';
import { AppointmentModel } from 'src/app/interfaces/appointment-model';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, Subscription } from 'rxjs';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointment.page.html',
  styleUrls: ['./appointment.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, FormsModule]
})
export class AppointmentsPage implements OnInit, OnDestroy {

  appointments$!: Observable<AppointmentModel[]>;
  filteredAppointments$!: Observable<AppointmentModel[]>;

  // Usamos BehaviorSubject para manejar el filtro
  private selectedBarberFilterSubject = new BehaviorSubject<string>('todos');
  selectedBarberFilter = this.selectedBarberFilterSubject.asObservable();

  private subscriptions = new Subscription();

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
  async goToEdit(id: AppointmentModel['id']) {
    this.r.navigate([`form/${id}`], { relativeTo: this.route });
  }

  ngOnInit() {

    runInInjectionContext(this.injector, () => {
      const injec = inject(FirestoreService)
      this.appointments$ = injec.appointments$;
      this.cdr.detectChanges();
      this.filteredAppointments$ = combineLatest([
        this.appointments$,
        this.selectedBarberFilterSubject.asObservable()
      ]).pipe(
        map(([appointments, filterValue]) => {
          if (filterValue === 'todos') {
            return appointments;
          } else {
            return appointments.filter(
              (appointment) => appointment.barber === filterValue
            );
          }
        })
      );
    });
  }

  filterAppointments(event: any) {

    this.selectedBarberFilterSubject.next(event.detail.value);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
