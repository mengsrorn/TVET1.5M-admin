import { Major } from './major';
import { School } from './school';

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface StudentRequestReport {
  requestBySchool: any;
  requestByMajor: any;
}

export interface ApplyCountBySchool {
  filter(arg0: (item: any) => boolean): unknown;
  start_date: Date;
  start_end: Date;
  header_columns: { _id: string; name: string }[];
  report_data: SchoolReport[];
  total_data?: StudentDataReport[];
  total_count?: number;
}

export interface SchoolReport {
  _id?: number;
  schools?: School[];
  name: string;
  name_en: string;
  student_data: StudentDataReport[];
  apply_majors?: Major[];
  course_start?: Date;
  course_end?: Date;
}

export interface SchoolReportInfo {
  _id?: string;
  name: string;
  name_en: string;
  code: string;
}

export interface StudentDataReport {
  _id: number;
  total_student: number;
  total_female: number;
  total_course_finish?: number;
  total_new_course_finish?: number;
  name?: string;
  name_en?: string;
}

export interface StudentWeeklyDataReport {
  _id: number;
  total_student: number;
  total_student_female: number;
  total_student_male: number;
  total_student_poor_1: number;
  total_student_poor_1_female: number;
  total_student_poor_1_male: number;
  total_student_poor_2: number;
  total_student_poor_2_female: number;
  total_student_poor_2_male: number;
  total_student_near_poor: number;
  total_student_near_poor_female: number;
  total_student_near_poor_male: number;
  total_student_not_poor: number;
  total_student_not_poor_female: number;
  total_student_not_poor_male: number;
  name?: string;
  name_en?: string;
}

