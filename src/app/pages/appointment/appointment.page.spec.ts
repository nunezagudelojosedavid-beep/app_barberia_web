import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentsPage } from './appointment.page';

describe('AppointmentPage', () => {
  let component: AppointmentsPage;
  let fixture: ComponentFixture<AppointmentsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AppointmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
