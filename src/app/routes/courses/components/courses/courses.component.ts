import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { pAdmin } from 'src/app/helpers/permission';
import { Course } from 'src/app/models/course';
import { BaseDatatable } from 'src/app/models/datatables/base.datatable';
import { TableColumn } from 'src/app/models/table-column';
import { CourseService } from 'src/app/services/course.service';
import { DialogService } from 'src/app/services/dialog.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { Pagination } from 'src/app/shares/pagination/pagination';
import { SnackbarComponent } from 'src/app/shares/snackbar/components/snackbar/snackbar.component';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class CoursesComponent {
  pCourse = pAdmin.course;
  params = {
    limit: 10,
    page: 1,
    search: ''
  };
  tableColumns: TableColumn[] = [
    {
      name: 'table.code',
      dataKey: 'code',
      custom: true
    },
    {
      name: 'table.major',
      dataKey: 'major',
      custom: true
    },
    {
      name: 'table.registration_date',
      dataKey: 'register_date',
      custom: true
    },
    {
      name: 'table.course_date',
      dataKey: 'course_date',
      custom: true
    },
    {
      name: 'table.shift',
      dataKey: 'shift',
      custom: true
    },
    {
      name: 'table.school',
      dataKey: 'school',
      custom: true
    },
    {
      name: 'table.student_count',
      dataKey: 'student_count',
      custom: true
    },
    {
      name: 'table.action',
      dataKey: 'action',
      custom: true
    }
  ];
  tableData: BaseDatatable<Course>;

  filterData$!: Observable<unknown>;

  filterParams: Params = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public courseService: CourseService,
    public translate: TranslateService,
    private snackbarService: SnackbarService,
    private dialogService: DialogService
  ) {
    this.filterData$ = courseService.filterData();
  }

  ngOnInit(): void {
    this.getCourses();
  }

  getCourses(pagination?: Pagination) {
    const params = { ...this.params, ...pagination, ...this.filterParams };
    this.courseService.getMany(params).subscribe({
      next: res => {
        this.tableData = res;
      }
    });
  }

  onCreate() {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  actionEvent(button: string, id: string): void {
    if (button === 'delete') {
      this.onDelete(id);
    }
  }

  onDelete(id: string) {
    this.dialogService
      .onShowDialog({
        title: 'លុបវគ្គសិក្សា',
        message: 'តើអ្នកពិតជាចង់វគ្គសិក្សានេះមែនទេ?'
      })
      .afterClosed()
      .subscribe(res => {
        if (res === 'confirm') {
          this.courseService.delete(id).subscribe({
            next: () => {
              this.snackbarService.onShowSnackbar({ message: 'delete', component: SnackbarComponent });
              this.getCourses();
            }
          });
        }
      });
  }

  //TODO: searching functions
  timer: ReturnType<typeof setTimeout>;
  onSearch(value: string) {
    this.params.search = value;
    this.startSearch();
  }
  startSearch() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.getCourses(), 500);
  }

  goTo(pagination: Pagination) {
    this.getCourses(pagination);
  }

  //Filtering Data Functions
  setParams(filterParams: Params): void {
    if (Object.keys(filterParams).length < 1) this.filterParams = [];
    else this.filterParams = filterParams;
    this.startSearch();
  }
}
