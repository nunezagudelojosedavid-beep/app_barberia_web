import { Component, EnvironmentInjector, inject, OnInit, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { IonicModule, IonModal, IonDatetime, IonDatetimeButton, IonPicker, IonButton } from '@ionic/angular';
import { AppointmentModel } from 'src/app/interfaces/appointment-model';
import { FirestoreService } from 'src/app/services/firestore';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User } from 'src/app/interfaces/user';

@Component({
  selector: 'app-appointment-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule,
    ReactiveFormsModule,
  ]
})
export class AppointmentFormPage implements OnInit {

  appointmentForm: FormGroup;
  today: string;
  oneWeekFromNow: string;
  appointmentId: string | null = null;
  formattedAppointmentDate: string | null = null;
  isViewing: boolean = false;

  days: { label: string, date: Date }[] = [];
  availableHours: string[] = [];
  selectedDate: Date | null = null;
  selectedHour: string | null = null;
  serviceDuration: number = 0; // Duración total del servicio

  // Simulación de la disponibilidad del barbero
  barberAvailability: string[] = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'];


  constructor(
    private formBuilder: FormBuilder,
    private firestoreService: FirestoreService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {

    // Configuración de las fechas
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    this.today = today.toISOString();
    this.oneWeekFromNow = oneWeekFromNow.toISOString();

    this.appointmentForm = this.formBuilder.group({
      service: ['', Validators.required],
      barber: ['', Validators.required],
      date: [''],
      clientName: ['', Validators.required],
      clientPhone: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  private readonly injector = inject(EnvironmentInjector);
  ngOnInit() {

    runInInjectionContext(this.injector, () => {
      this.appointmentId = this.activatedRoute.snapshot.paramMap.get('id');
      console.log("CITAId", this.appointmentId);

      if (this.appointmentId) {
        console.log('CITA ID recibido:', this.appointmentId);
        this.isViewing = true;
        this.loadAppointmentForm(this.appointmentId);
      } else {
        this.generateNext7Days();
      }
    });

  }
  onDaySelected(event: any) {
    const selectedDateStr = event.detail.value;
    this.selectedDate = new Date(selectedDateStr);
    this.selectedHour = null;
    this.loadAvailableHours();
  }

  onHourSelected(event: any) {
    const hour = event.detail.value;
    this.selectedHour = hour;
    console.log('this.selectedHour', this.selectedHour);
    if (this.selectedDate) {
      const [h, m] = hour.split(':').map(Number);

      // Obtiene los componentes de la fecha seleccionada
      const year = this.selectedDate.getFullYear();
      const month = this.selectedDate.getMonth();
      const day = this.selectedDate.getDate();

      // Crea un nuevo objeto Date usando los componentes locales
      const combinedDate = new Date(year, month, day, h, m, 0);
      console.log('combinedDate', combinedDate);
      this.appointmentForm.patchValue({ date: combinedDate });
    }
  }

  generateNext7Days() {
    this.days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      let label = '';
      if (i === 0) {
        label = 'Hoy';
      } else if (i === 1) {
        label = 'Mañana';
      } else {
        const dayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        label = dayFormatter.format(date);
      }
      this.days.push({ label, date });
    }
  }

  selectDay(day: { label: string, date: Date }) {
    this.selectedDate = day.date;
    this.selectedHour = null;
    this.loadAvailableHours();
    console.log('selectedDate', this.selectedDate)
  }

  loadAvailableHours() {
    const filteredHours = this.barberAvailability.filter(hour => {
      const [h, m] = hour.split(':').map(Number);
      const startTimeInMinutes = h * 60 + m;
      const endTimeInMinutes = startTimeInMinutes + this.serviceDuration;
      const hasConflict = this.checkIfConflicting(this.selectedDate, startTimeInMinutes, endTimeInMinutes);
      return !hasConflict;
    });
    this.availableHours = filteredHours;
  }

  private checkIfConflicting(date: Date | null, startTime: number, endTime: number): boolean {
    // Lógica para verificar conflictos con citas existentes.
    // En el mundo real, aquí harías una consulta a la base de datos.
    return false;
  }

  selectHour(hour: string) {
    this.selectedHour = hour;
    if (this.selectedDate) {
      const combinedDate = new Date(this.selectedDate.toISOString().split('T')[0] + 'T' + hour + ':00');
      this.appointmentForm.patchValue({ date: combinedDate });
    }
  }

  async onSubmit() {
    if (this.appointmentForm.valid) {
      const appointment: AppointmentModel = {
        service: this.appointmentForm.value.service,
        barber: this.appointmentForm.value.barber,
        date: this.appointmentForm.value.date, // Convertimos el string a un objeto Date
        clientName: this.appointmentForm.value.clientName,
        clientPhone: this.appointmentForm.value.clientPhone,
        status: 'agendada'
      };
      console.log('appoinmentForm', appointment)

      const appointmentData = this.appointmentForm.getRawValue();

      if (this.appointmentId) {
        await this.firestoreService.updateAppointment(this.appointmentId, appointmentData);
        console.log('Cita actualizada con éxito:', appointmentData);
        this.router.navigate(['/appointment']);
      } else {
        try {
          await this.firestoreService.addAppointment(appointment);
          console.log('Cita agendada con éxito:', appointment);
          this.appointmentForm.reset();
          this.router.navigate(['/appointment']);
        } catch (error) {
          console.error('Error al agendar la cita:', error);
        }
      }
    }
  }

  async loadAppointmentForm(id: string) {
  const userDocRef = await this.firestoreService.getAppointmentById(id);
  console.log('userDocRef', userDocRef);
  if (userDocRef) {
    if (userDocRef.date instanceof Date) {
      // 2. Cargamos los días y las horas para que el usuario pueda reagendar
      this.generateNext7Days();

      // 3. Establecemos la fecha y hora seleccionadas
      this.selectedDate = userDocRef.date;
      this.selectedHour = userDocRef.date.toTimeString().slice(0, 5);

      // 4. Cargamos las horas disponibles para ese día
      this.loadAvailableHours();
    }
    console.log('loaduserform', userDocRef);
    if (userDocRef.date instanceof Date) {
      const dayFormatter = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
      this.formattedAppointmentDate = dayFormatter.format(userDocRef.date);

      this.appointmentForm.patchValue(userDocRef);

    }
  } else {
    console.log('no hay loaduserform', userDocRef);
  }
}

  async deleteAppointment() {
  const user = await this.firestoreService
    .deleteAppointmentById(this.appointmentId);
  this.router.navigate(['/appointment']);

}
}