import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportStudentInternshipComponent } from './report-student-internship.component';

describe('ReportStudentInternshipComponent', () => {
  let component: ReportStudentInternshipComponent;
  let fixture: ComponentFixture<ReportStudentInternshipComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportStudentInternshipComponent]
    });
    fixture = TestBed.createComponent(ReportStudentInternshipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
