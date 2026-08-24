import Database from "better-sqlite3";

export interface ExitDetails {
  employee_id: number;
  exit_type: string | null;
  resignation_date: string | null;
  last_working_date: string | null;
  notice_period_days: number | null;
  notice_period_served: number;
  notice_period_waived: number;
  reason_for_leaving: string | null;
  exit_interview_date: string | null;
  exit_interview_remarks: string | null;
  resignation_letter_path: string | null;
  company_assets_returned: number;
  no_due_status: string | null;
  fnf_status: string | null;
  settlement_date: string | null;
  relieving_letter_path: string | null;
  experience_letter_path: string | null;
  final_settlement_amount: number | null;
  remarks: string | null;
}

export type ExitDetailsInput = Omit<
  ExitDetails,
  "employee_id" | "resignation_letter_path" | "relieving_letter_path" | "experience_letter_path"
>;

export class ExitDetailsRepository {
  constructor(private db: Database.Database) {}

  find(employeeId: number): ExitDetails | undefined {
    return this.db
      .prepare("SELECT * FROM employee_exit_details WHERE employee_id = ?")
      .get(employeeId) as ExitDetails | undefined;
  }

  upsert(employeeId: number, data: ExitDetailsInput): void {
    const exists = this.find(employeeId);
    const payload = { ...data, employee_id: employeeId };
    if (exists) {
      this.db
        .prepare(
          `UPDATE employee_exit_details SET
            exit_type=@exit_type, resignation_date=@resignation_date, last_working_date=@last_working_date,
            notice_period_days=@notice_period_days, notice_period_served=@notice_period_served,
            notice_period_waived=@notice_period_waived, reason_for_leaving=@reason_for_leaving,
            exit_interview_date=@exit_interview_date, exit_interview_remarks=@exit_interview_remarks,
            company_assets_returned=@company_assets_returned, no_due_status=@no_due_status,
            fnf_status=@fnf_status, settlement_date=@settlement_date,
            final_settlement_amount=@final_settlement_amount, remarks=@remarks
           WHERE employee_id=@employee_id`
        )
        .run(payload);
    } else {
      this.db
        .prepare(
          `INSERT INTO employee_exit_details
            (employee_id, exit_type, resignation_date, last_working_date, notice_period_days,
             notice_period_served, notice_period_waived, reason_for_leaving, exit_interview_date,
             exit_interview_remarks, company_assets_returned, no_due_status, fnf_status,
             settlement_date, final_settlement_amount, remarks)
           VALUES (@employee_id, @exit_type, @resignation_date, @last_working_date, @notice_period_days,
             @notice_period_served, @notice_period_waived, @reason_for_leaving, @exit_interview_date,
             @exit_interview_remarks, @company_assets_returned, @no_due_status, @fnf_status,
             @settlement_date, @final_settlement_amount, @remarks)`
        )
        .run(payload);
    }
  }
}
