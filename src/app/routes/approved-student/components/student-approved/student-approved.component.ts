import { Component } from '@angular/core';
import { Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { pAdmin } from 'src/app/helpers/permission';
import { DESTROYER$ } from 'src/app/helpers/unsubscribe';
import { BaseDatatable } from 'src/app/models/datatables/base.datatable';
import EnumConstant from 'src/app/models/enums/enumConstant';
import { Student } from 'src/app/models/student';
import { TableColumn } from 'src/app/models/table-column';
import { StudentService } from 'src/app/services/student.service';
import { Pagination } from 'src/app/shares/pagination/pagination';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-student-approved',
  templateUrl: './student-approved.component.html',
  styleUrls: ['./student-approved.component.scss']
})
export class StudentApprovedComponent {
  private readonly destroyer$ = DESTROYER$();

  pAttendance = pAdmin.studentAttendance;

  params: Pagination = {
    limit: 10,
    page: 1,
    search: ''
  };
  tableColumns: TableColumn[] = [
    {
      name: 'table.name',
      dataKey: 'name',
      custom: true,
      isSortable: true
    },
    {
      name: 'table.phone',
      dataKey: 'phone',
      custom: true
    },
    
    {
      name: 'table.schools',
      dataKey: 'schools',
      custom: true
    },
    {
      name: 'table.major',
      dataKey: 'major',
      custom: true
    },
    {
      name: 'table.poor_id',
      dataKey: 'poor_id',
      custom: true
    },
    {
      name: 'table.status',
      dataKey: 'status',
      custom: true
    },
    {
      name: 'table.action',
      dataKey: 'action',
      custom: true
    }
  ];
  tableData: BaseDatatable<Student>;

  requestUrl: string;

  filterData$!: Observable<unknown>;

  filterParams: Params = {};

  constructor(public translate: TranslateService, private studentService: StudentService, private route:Router) {
    this.requestUrl = studentService.path + '/approved_list';
    this.filterData$ = studentService.filterDataStudent();
  }

  ngOnInit(): void {
    this.onLoad();
  }

  onLoad(pagination?: Pagination): void {
    const params = { ...this.params, ...pagination, ...this.filterParams };
    this.studentService
      .getApprovedStudent(params)
      .pipe(takeUntil(this.destroyer$))
      .subscribe({
        next: res => {
          this.tableData = res;
        }
      });
  }

  //TODO: searching functions
  timer: ReturnType<typeof setTimeout>;
  onSearch(value: string): void {
    this.params.search = value;
    this.startSearch();
  }

  startSearch(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.onLoad(), 500);
  }

  goTo(pagination: Pagination): void {
    this.onLoad(pagination);
  }

  //Filtering Data Functions
  setParams(filterParams: Params): void {
    if (Object.keys(filterParams).length < 1) this.filterParams = [];
    else this.filterParams = filterParams;
    this.startSearch();
  }

  redirectIntern(){
    window.open('https://school-admin.tvet.gov.kh/scholarship/student','_blank');
  }

  onExportFile(): void {
      //clone table from parent element
      const table = document.getElementById('approved-scholarship-table')?.cloneNode(true) as HTMLElement;

      //remove action columns
      this.onCheckTable(table);
  
      const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(table);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
      /* save to file */
      XLSX.writeFile(wb, 'file.xlsx');
  }

  onCheckTable(element: HTMLElement): void {
    const table = element;

    //remove th element -> class = mat-column-table-action from table element
    //TODO: custom view when export to excel
    let thRemove = table
      .getElementsByTagName('thead')[0]
      ?.getElementsByTagName('tr')[0]
      ?.getElementsByClassName('mat-column-table-action');
    for (let i = thRemove?.length - 1; i >= 0; i--) {
      thRemove[i]?.remove();
    }

    //remove td element -> class = mat-column-table-action from table element
    //TODO: custom view when export to excel
    let tds = table.getElementsByTagName('tbody')[0]?.children;
    for (let index = 0; index < tds?.length; index++) {
      let tdRemove = tds[index]?.getElementsByClassName('mat-column-table-action');
      for (let i = tdRemove?.length - 1; i >= 0; i--) {
        tdRemove[i]?.remove();
      }
    }
  }
}
