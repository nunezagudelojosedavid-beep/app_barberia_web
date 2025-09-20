import { Component, EnvironmentInjector, inject, OnInit, runInInjectionContext } from '@angular/core';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import {
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Observable } from 'rxjs';
import { User } from 'src/app/interfaces/user';
import { FirestoreService } from 'src/app/services/firestore';

@Component({
  selector: 'app-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],
  imports: [IonicModule, ReactiveFormsModule, AngularFirestoreModule
  ],
  standalone: true

})
export class FormPage implements OnInit {

  userId: string | null = null;
  usersId$!: Observable<User[]>
  userForm: FormGroup;
  newuser: User[] = [];
  tittle = this.userId ? 'Editar Usuario' : 'Crear Usuario';

  constructor(
    private afs: FirestoreService,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router) {

    this.userForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(10)]],
      role: ['client', Validators.required],
      isSubscribed: [false, Validators.required],
    });

  }

  private readonly injector = inject(EnvironmentInjector);
  ngOnInit() {
    runInInjectionContext(this.injector, () => {
      this.userId = this.activatedRoute.snapshot.paramMap.get('id');
      console.log("userId", this.userId);

      if (this.userId) {
        console.log('ID recibido:', this.userId);
        this.loadUserForm(this.userId);
      }
    });
  }

  async onSubmit() {
    if (this.userForm.valid) {

      const userData = this.userForm.getRawValue();
      console.log("userdata", this.userId);
      if (this.userId) {
        const updatedUser: User = { id: this.userId, ...userData };
        console.log('updatedUser-antes', updatedUser);
        await this.afs.updateUser(this.userId, userData);
        console.log('Usuario actualizado:', updatedUser);
        this.router.navigate(['/usuarios']);
      } else {
        console.log('else', userData)
        await this.afs.setUsers(userData)
          .then(() => {
            console.log('Usuario creado con exito', userData);
            this.userForm.reset({ role: 'client', isSubscribed: false });
            this.router.navigate(['/usuarios']);
          })
          .catch((error) => {
            console.error('Error creando usuario:', error);
          });
      }
    }
  }

  async loadUserForm(id: string) {
    console.log('id-loaduserform', id);
    const user = await this.afs.getUserById(id);
    if (user) {
      // Si el usuario existe, llena el formulario con sus datos
      this.userForm.patchValue(user);
      console.log('loaduserform', user);
    } else {
      console.log('no hay loaduserform', user);
    }
  }

  async deleteUser() {
    const user = await this.afs.deleteUserById(this.userId);
    this.router.navigate(['/usuarios']);
  }
}