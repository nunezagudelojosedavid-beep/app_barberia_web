import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { BehaviorSubject, catchError, firstValueFrom, Observable, of } from 'rxjs';
import { User } from '../interfaces/user';
import { updateDoc, serverTimestamp } from "firebase/firestore";

@Injectable({
  providedIn: 'root'
})

export class FirestoreService {

  private userCollection: AngularFirestoreCollection<User>;
  private user: Observable<User[]>;
  private userById: Observable<User[]>;
  private _users = new BehaviorSubject<User[]>([]);

  constructor(private readonly afs: AngularFirestore,
  ) {

    this.userCollection = this.afs.collection<User>('users');
    this.user = this.userCollection.valueChanges({ idField: 'id' });
    this.userById = this.userCollection.valueChanges({ idField: 'id' });

    this.userCollection.valueChanges({ idField: 'id' }).pipe(
      catchError(error => {
        console.error('Error al cargar los usuarios:', error);
        return of([]);
      })
    ).subscribe(data => {
      this._users.next(data);
    });
  }

  getCollectionName(): string {
    return this.userCollection.ref.path;
  }

  getUsers(): Observable<User[]> {
    return this._users;
  }

  async setUsers(user: User): Promise<void> {
    try {
      const docRef = await this.userCollection.add(user);
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
  async deleteUserById(id: any): Promise<void> {

    runInInjectionContext(this.injector, () => {

      const userDocRef = this.afs.doc<User>(`users/${id}`);
      userDocRef.delete();
      console.log('Usuario actualizado con ID: ', id);
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
}
