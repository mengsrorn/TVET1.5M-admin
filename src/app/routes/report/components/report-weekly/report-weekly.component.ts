import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { map, takeUntil } from 'rxjs';
import { DESTROYER$ } from 'src/app/helpers/unsubscribe';
import { ApplyCountBySchool } from 'src/app/models/report';
import { LoadingService } from 'src/app/services/loading.service';
import { ReportService } from 'src/app/services/report.service';
import { Pagination } from 'src/app/shares/pagination/pagination';
import { environment } from 'src/environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-report-weekly',
  templateUrl: './report-weekly.component.html',
  styleUrls: ['./report-weekly.component.scss']
})
export class ReportWeeklyComponent {
  private readonly destroyer$ = DESTROYER$();

  readonly loadingService = inject(LoadingService);
  private readonly reportService = inject(ReportService);

  date: Date = new Date();
  endDate: Date = new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0);

  form = inject(FormBuilder).group({
    end: [null, Validators.required]
  });

  // Add later
  requestUrl: string = environment.api_url + this.reportService.path + '/weekly_report';

  baseColumn: string[] = ['position', 'startDate', 'endDate', 'major', 'schools'];
  exportColumn: string[] = this.baseColumn;
  tableDataSource = new MatTableDataSource<ApplyCountBySchool>(null);
  displayedColumns: string[] = this.baseColumn;

  baseTopColumn: string[] = ['#', 'ថ្ងៃចូលរៀន', 'ថ្ងៃបញ្ចប់វគ្គ', 'ឈ្មោះជំនាញ', 'ឈ្មោះគ្រឹះស្ថាន'];

  topColumn: string[] = this.baseTopColumn;
  dynamicColumn: { _id: string; name: string; subColumns: any[] }[];
  thirdColumn: string[];
  thirdDisplayedColumn: string[];
  data: ApplyCountBySchool;

  params = {
    limit: 10,
    page: 1
  };
  total: 0;

  onLoad(pagination?): void {
    this.loadingService.setLoading('page', true);
    let data = [];

    let endDate: string = `${new Date(this.form.value.end).toLocaleDateString('en-ZA')} ${new Date(
      this.form.value.end
    ).toLocaleTimeString('en-US', { hour12: false })}`;
    let index = pagination ? (pagination.page - 1) * this.params.limit + 1 : 1; // Initialize index

    this.reportService
      .getWeeklyReport({ ...this.params, ...pagination, end_date: endDate })
      .pipe(
        map(map => {
          if (map?.report_data?.length > 0) {
            for (const body of map.report_data) {
              data.push({ ...body, colSpan: this.baseTopColumn?.length - 1, index: index++ });
            }
          }

          //columns management
          if (map?.header_columns?.length > 0) {
            //second header in table
            this.exportColumn = []; //assign to table
            this.dynamicColumn = []; //display
            this.thirdColumn = [];

            this.topColumn = [...this.baseTopColumn, ...map?.header_columns.map(map => map.name)];

            //mapping second header
            for (let index = 0; index < map.header_columns?.length; index++) {
              let result = map.header_columns[index];

              // Original 5 columns for each second header
              for (let j = 0; j < 5; j++) {
                this.exportColumn.push('th' + index + j);
                const dynamicColumnEntry = {
                  name: 'th' + index + j,
                  _id: result._id,
                  subColumns: []
                };

                // Adding 3 additional sub-columns to each column's subColumns
                for (let k = 0; k < 3; k++) {
                  this.thirdColumn.push('th' + index + j + 'sub' + k);
                  dynamicColumnEntry.subColumns.push({
                    name: 'th' + index + j + 'sub' + k,
                    _id: result._id
                  });
                }

                this.dynamicColumn.push(dynamicColumnEntry);
              }
            }
          }

          return map;
        }),
        takeUntil(this.destroyer$)
      )
      .subscribe({
        next: res => {
          this.data = res;
          this.tableDataSource = new MatTableDataSource(data);
          this.displayedColumns = [...this.baseColumn, ...this.exportColumn];
          this.thirdDisplayedColumn = [...this.baseColumn, ...this.thirdColumn];
          this.loadingService.setLoading('page', false);

          setTimeout(() => {
            this.onCheckTable();
          }, 0);
        },
        error: () => this.loadingService.setLoading('page', false)
      });
  }
  onExportFile(): void {
    const table = document.getElementById('table')?.cloneNode(true) as HTMLElement;

    //add title in excel file
    // let element = document.createElement('tr');
    // table.getElementsByTagName('thead')[0].prepend(element);
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(table);

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, 'file.xlsx');
  }

  onCheckTable(): void {
    const table = document.getElementById('table');

    //remove th element -> class = display-none from table element
    //TODO: custom view when export to excel
    let thRemove1 = table
      .getElementsByTagName('thead')[0]
      ?.getElementsByTagName('tr')[1]
      ?.getElementsByClassName('display-none');

    for (let i = thRemove1?.length - 1; i >= 0; i--) {
      thRemove1[i]?.remove();
    }
    let thRemove2 = table
      .getElementsByTagName('thead')[0]
      ?.getElementsByTagName('tr')[2]
      ?.getElementsByClassName('display-none');

    for (let i = thRemove2?.length - 1; i >= 0; i--) {
      thRemove2[i]?.remove();
    }

    //remove td element -> class = display-none from table element
    //TODO: custom view when export to excel
    let tds = table.getElementsByTagName('tbody')[0]?.children;
    for (let index = 0; index < tds?.length; index++) {
      let tdRemove = tds[index]?.getElementsByClassName('display-none');
      for (let i = tdRemove?.length - 1; i >= 0; i--) {
        tdRemove[i]?.remove();
      }
    }
  }

  dateRangeChange(): void {
    if (this.form.valid) {
      this.onLoad();
    } else return;
  }

  onDateChange(): void {
    this.form.markAllAsTouched();
    this.dateRangeChange();
  }

  onInputDate(): void {
    let data = this.form.value;
    if (!data.end) {
      // !!data.start &&  && new Date(data.start).getTime() > new Date(data.end).getTime()
      this.form.controls.end.markAsTouched();
      this.form.controls.end.setErrors({ 'minDate': true });
    } else if (!!this.form.controls.end.value && this.form.controls.end.invalid) this.form.controls.end.setErrors(null);
  }

  trackByFn(index: number, item: any): void {
    return item?._id ?? index ?? item?.name ?? item;
  }
  goTo(pagination?: Pagination) {
    this.params.page = pagination.page;
    this.onLoad(pagination);
  }
}
