// src/app/services/firestore.ts

import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../interfaces/user';
import { AppointmentModel } from '../interfaces/appointment-model';
import { Barber } from '../interfaces/barber';
import { Service } from '../interfaces/service';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  // Colecciones de Firestore
  private usersCollection: AngularFirestoreCollection<User>;
  private appointmentsCollection: AngularFirestoreCollection<AppointmentModel>;
  private barbersCollection: AngularFirestoreCollection<Barber>;
  private servicesCollection: AngularFirestoreCollection<Service>;

  // BehaviorSubjects para almacenar la data en memoria
  private _users = new BehaviorSubject<User[]>([]);
  private _appointments = new BehaviorSubject<AppointmentModel[]>([]);
  private _barbers = new BehaviorSubject<Barber[]>([]);
  private _services = new BehaviorSubject<Service[]>([]);

  // Observables públicos para que los componentes puedan suscribirse
  readonly users$ = this._users.asObservable();
  readonly appointments$ = this._appointments.asObservable();
  readonly barbers$ = this._barbers.asObservable();
  readonly services$ = this._services.asObservable();

  constructor(private readonly afs: AngularFirestore) {
    // Inicializa las conexiones a las colecciones
    this.usersCollection = this.afs.collection<User>('users');
    this.appointmentsCollection = this.afs.collection<AppointmentModel>('appointments');
    this.barbersCollection = this.afs.collection<Barber>('barbers');
    this.servicesCollection = this.afs.collection<Service>('services');

    // Carga inicial y suscripciones en el constructor
    this.loadUsers();
    this.loadAppointments();
    this.loadBarbers();
    this.loadServices();
  }

  getCollectionName(): string {
    return this.usersCollection.ref.path;
  }

  private loadAppointments(): void {
    this.appointmentsCollection.valueChanges({ idField: 'id' }).pipe(
      map(appointments => {
        // Mapea y convierte el timestamp a Date
        return appointments.map(app => ({
          ...app,
          date: (app.date as any)?.toDate ? (app.date as any).toDate() : app.date
        }));
      }),
      catchError(error => {
        console.error('Error al cargar las citas:', error);
        return of([]);
      })
    ).subscribe(data => {
      this._appointments.next(data);
    });
  }

  private loadBarbers(): void {
    this.barbersCollection.valueChanges({ idField: 'id' }).pipe(
      catchError(error => {
        console.error('Error al cargar los barberos:', error);
        return of([]);
      })
    ).subscribe(data => {
      this._barbers.next(data);
    });
  }

  private loadServices(): void {
    this.servicesCollection.valueChanges({ idField: 'id' }).pipe(
      catchError(error => {
        console.error('Error al cargar los servicios:', error);
        return of([]);
      })
    ).subscribe(data => {
      this._services.next(data);
    });
  }

  // --- Métodos de CRUD para Usuarios ---
  addUser(user: User): Promise<string> {
    return this.usersCollection.add(user).then(docRef => docRef.id);
  }

  // --- Métodos de CRUD para Citas ---
  addAppointment(appointment: AppointmentModel): Promise<string> {
    return this.appointmentsCollection.add(appointment).then(docRef => docRef.id);
  }

  // --- Métodos de CRUD para Barberos ---
  addBarber(barber: Barber): Promise<string> {
    return this.barbersCollection.add(barber).then(docRef => docRef.id);
  }

  // --- Métodos de CRUD para Servicios ---
  addService(service: Service): Promise<string> {
    return this.servicesCollection.add(service).then(docRef => docRef.id);
  }
  private loadUsers(): void {
    this.usersCollection.valueChanges({ idField: 'id' }).pipe(
      catchError(error => {
        console.error('Error al cargar los usuarios:', error);
        return of([]);
      })
    ).subscribe(data => {
      this._users.next(data);
    });
  }

  getUsers(): Observable<User[]> {
    return this._users;
  }

  async setUsers(user: User): Promise<void> {
    try {
      const docRef = await this.usersCollection.add(user);
      console.log('Usuario añadido con ID: ', docRef.id);

      // actualiza el mismo documento para incluir su ID

      await docRef.update({ id: docRef.id });
      console.log('Usuario actualizado con ID: ', docRef.id);


    } catch (error) {
      console.error('Error al añadir usuario: ', error);
    }
  }

  private readonly injector = inject(EnvironmentInjector);

  async updateUser(id: User['id'], user: User): Promise<void> {

    runInInjectionContext(this.injector, () => {

      const userDocRef = this.afs.doc<User>(`users/${id}`);
      userDocRef.update(user);
      console.log('Usuario actualizado con ID: ', id);
    });
  }
  async updateAppointment(id: AppointmentModel['id'], appointment: AppointmentModel): Promise<void> {

    runInInjectionContext(this.injector, () => {

      const userDocRef = this.afs.doc<AppointmentModel>(`appointments/${id}`);
      userDocRef.update(appointment);
      console.log('Cita actualizada con ID: ', id);
    });
  }

  async getAppointmentsForBarberAndDay(barberId: string, date: Date): Promise<any[]> {

    return runInInjectionContext(this.injector, async () => {

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = this.afs.collection('appointments', ref =>
        ref.where('barber', '==', barberId)
          .where('date', '>=', startOfDay)
          .where('date', '<=', endOfDay)
      );

      const snapshot = await q.get().toPromise();

      if (!snapshot || !snapshot.docs) {
        return [];
      }

      // Mapea los documentos y convierte el timestamp a Date
      const appointments = snapshot.docs.map(doc => {
        const data = doc.data() as AppointmentModel;
        const id = doc.id;
        return {
          ...data,
          id,
          date: (data.date as any)?.toDate ? (data.date as any).toDate() : data.date
        };
      });

      return appointments;

    });
  }

  async deleteUserById(id: any): Promise<void> {

    runInInjectionContext(this.injector, () => {

      const userDocRef = this.afs.doc<User>(`users/${id}`);
      userDocRef.delete();
      console.log('Usuario actualizado con ID: ', id);
    });
  }
  async deleteAppointmentById(id: any): Promise<void> {

    runInInjectionContext(this.injector, () => {

      const userDocRef = this.afs.doc<User>(`appointments/${id}`);
      userDocRef.delete();
      console.log('Cita eliminada con ID: ', id);
    });
  }

  async getUserById(id: string): Promise<User | null> {
    // Obtén la referencia del documento por su ID
    const userDocRef = this.afs.doc<User>(`users/${id}`);
    // firstValueFrom porque es behabior observable
    const snapshot = await firstValueFrom(userDocRef.get());

    // Verifica si el documento existe
    if (snapshot && snapshot.exists) {
      // Obtén los datos del documento
      const userData = snapshot.data() as User;
      return { id: snapshot.id, ...userData } as User;
    } else {
      // Si no se encuentra el documento, retorna null
      return null;
    }
  }
  async getAppointmentById(id: string): Promise<AppointmentModel | null> {
    return runInInjectionContext(this.injector, async () => {
      // Obtén la referencia del documento por su ID
      const userDocRef = this.afs.doc<AppointmentModel>(`appointments/${id}`);
      // firstValueFrom porque es behabior observable
      const snapshot = await firstValueFrom(userDocRef.get());

      // Verifica si el documento existe
      if (snapshot && snapshot.exists) {

        // Obtén los datos del documento
        const userData = snapshot.data() as AppointmentModel;

        // --- Paso clave: Conversión del Timestamp a Date ---
        const convertedData = { ...userData };
        if (convertedData.date && typeof (convertedData.date as any).toDate === 'function') {
          convertedData.date = (convertedData.date as any).toDate();
        }
        // Obtén los datos del documento
        return { id: snapshot.id, ...convertedData } as AppointmentModel;
      } else {
        // Si no se encuentra el documento, retorna null
        return null;
      }
    })
  }
}