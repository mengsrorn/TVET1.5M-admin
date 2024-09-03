import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Params } from '@angular/router';
import { map, Observable, takeUntil } from 'rxjs';
import { DESTROYER$ } from 'src/app/helpers/unsubscribe';
import { useFilter } from 'src/app/models/filter';
import { ApplyCountBySchool } from 'src/app/models/report';
import { LoadingService } from 'src/app/services/loading.service';
import { ReportService } from 'src/app/services/report.service';
import { SchoolService } from 'src/app/services/school.service';
import { environment } from 'src/environments/environment';
import * as XLSX from 'xlsx';
@Component({
  templateUrl: './report-enrollment-by-city-province.component.html',
  styleUrls: ['./report-enrollment-by-city-province.component.scss']
})
export class ReportEnrollmentByCityProvinceComponent {
  private readonly destroyer$ = DESTROYER$();
  readonly loadingService = inject(LoadingService);
  private readonly reportService = inject(ReportService);

  form = inject(FormBuilder).group({
    end: [null, Validators.required]
  });

  requestUrl: string = environment.api_url + this.reportService.path + '/student_poor_id_apply_city_province';

  baseColumn: string[] = ['position', 'institution', 'province', 'district'];
  exportColumn: string[] = this.baseColumn;
  tableDataSource = new MatTableDataSource<ApplyCountBySchool>(null);
  displayedColumns: string[] = this.baseColumn;
  baseTopColumn: string[] = [
    '#',
    'គ្រឹះស្ថានអប់រំបណ្ដុះបណ្ដាលបចេ្ចកទេស និងវិជ្ជាជីវៈ	',
    'រាជធានី-ខេត្តក្រុង',
    'ស្រុក-ខណ្ឌ'
  ];
  topColumn: string[] = this.baseTopColumn;
  dynamicColumn: { _id: string; name: string }[];

  data: ApplyCountBySchool;

  filterData$: Observable<unknown>;
  filterParams: Params = {};
  useFilter: useFilter[] = ['scholarship_status'];

  constructor(private schoolService: SchoolService) {
    this.filterData$ = this.schoolService.filterData();
  }

  onLoad() {
    this.loadingService.setLoading('page', true);
    let data = [];

    let endDate: string = `${new Date(this.form.value.end).toLocaleDateString('en-ZA')} ${new Date(
      this.form.value.end
    ).toLocaleTimeString('en-US', { hour12: false })}`;
    this.reportService
      .getStudentPoorIdByCityProvince({ ...this.filterParams, end_date: endDate })
      .pipe(
        map(map => {
          if (map?.report_data?.length > 0) {
            for (const body of map.report_data) {
              data.push({
                ...body,
                institution: true,
                colSpan: this.baseTopColumn?.length - 1
              });
              if (body?.['students'].length > 0) {
                // province mapping
                for (const [index, item] of body['students'].entries()) {
                  let dataHasProvince = data?.filter(fil => fil?.province);

                  data.push({
                    ...item,
                    province: true,
                    index: dataHasProvince?.length > 0 ? dataHasProvince[dataHasProvince.length - 1]?.index + 1 : 1,
                    colSpan: this.baseTopColumn?.length - 2
                  });

                  if (item?.districts?.length > 0) {
                    // district mapping
                    for (const district of item?.districts) {
                      if (district.name !== null) {
                        data.push({
                          ...district,
                          district: true,
                          colSpan: this.baseTopColumn.length - 3
                        });
                      }
                    }
                  }
                }
              }
            }
            data.push({
              index: 'សរុបរួម',
              province: true,
              student_data: map?.total_data
            });
          }

          if (map?.header_columns?.length > 0) {
            //second header in table
            this.exportColumn = []; //assign to table
            this.dynamicColumn = []; //display

            this.topColumn = [...this.baseTopColumn, ...map?.header_columns.map(map => map.name)];

            //mapping second header
            for (let index = 0; index < map.header_columns?.length; index++) {
              for (let j = 0; j < 2; j++) {
                let result = map.header_columns[index];
                this.exportColumn.push('th' + index + j);
                this.dynamicColumn.push({
                  name: 'th' + index + j,
                  _id: result._id
                });
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
          this.loadingService.setLoading('page', false);

          setTimeout(() => {
            this.onCheckTable();
          }, 0);
        },
        error: () => this.loadingService.setLoading('page', false)
      });
  }
  onCheckTable(): void {
    const table = document.getElementById('table');

    //remove th element -> class = display-none from table element
    //TODO: custom view when export to excel
    let thRemove = table
      .getElementsByTagName('thead')[0]
      ?.getElementsByTagName('tr')[1]
      ?.getElementsByClassName('display-none');

    for (let i = thRemove?.length - 1; i >= 0; i--) {
      thRemove[i]?.remove();
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
    let date = this.form.value;
    if (!date.end) {
      this.form.controls.end.markAllAsTouched();
      this.form.controls.end.setErrors({ 'minDate': true });
    } else if (!!this.form.controls.end.value && this.form.controls.end.invalid) this.form.controls.end.setErrors(null);
  }

  setParams(filterParams: Params): void {
    if (Object.keys(filterParams).length < 1) this.filterParams = [];
    else this.filterParams = filterParams;
  }

  trackByFn(index: number, item: any): void {
    return item?._id ?? index ?? item?.name ?? item;
  }

  onExportFile(): void {
    const table = document.getElementById('table')?.cloneNode(true) as HTMLElement;

    //add title in excel file
    let element = document.createElement('tr');
    table.getElementsByTagName('thead')[0].prepend(element);

    // let startDate: string = `${new Date(this.form.value.start).toLocaleDateString('en-ZA')}, ${new Date(
    //   this.form.value.start
    // ).toLocaleTimeString('en-US', { hour12: false })}`;
    let endDate: string = `${new Date(this.form.value.end).toLocaleDateString('en-ZA')}, ${new Date(
      this.form.value.end
    ).toLocaleTimeString('en-US', { hour12: false })}`;

    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(table);

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, 'file.xlsx');
  }
}
