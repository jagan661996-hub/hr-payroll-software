import Database from "better-sqlite3";

export interface SalaryStructure {
  id: number;
  employee_id: number;
  effective_from: string;
  basic: number;
  dearness_allowance: number;
  hra: number;
  fixed_allowance: number;
  conveyance: number;
  medical_allowance: number;
  other_allowance: number;
  professional_tax: number;
  epf_employee: number;
  esi_employee: number;
  income_tax: number;
  loan_deduction: number;
  advance_deduction: number;
}

export type SalaryStructureInput = Omit<SalaryStructure, "id" | "employee_id">;

// Treated as "the employee's current salary configuration" rather
// than a full versioned history - HR edits it in place. The schema
// still has room for a real history-of-changes model later if needed
// (multiple rows per employee_id keyed by effective_from).
export class SalaryStructureRepository {
  constructor(private db: Database.Database) {}

  findByEmployee(employeeId: number): SalaryStructure | undefined {
    return this.db
      .prepare(
        `SELECT * FROM salary_structures WHERE employee_id = ? ORDER BY effective_from DESC LIMIT 1`
      )
      .get(employeeId) as SalaryStructure | undefined;
  }

  upsert(employeeId: number, data: SalaryStructureInput): void {
    const existing = this.findByEmployee(employeeId);
    if (existing) {
      this.db
        .prepare(
          `UPDATE salary_structures SET
            effective_from = ?, basic = ?, dearness_allowance = ?, hra = ?, fixed_allowance = ?,
            conveyance = ?, medical_allowance = ?, other_allowance = ?, professional_tax = ?,
            epf_employee = ?, esi_employee = ?, income_tax = ?, loan_deduction = ?, advance_deduction = ?
           WHERE id = ?`
        )
        .run(
          data.effective_from,
          data.basic,
          data.dearness_allowance,
          data.hra,
          data.fixed_allowance,
          data.conveyance,
          data.medical_allowance,
          data.other_allowance,
          data.professional_tax,
          data.epf_employee,
          data.esi_employee,
          data.income_tax,
          data.loan_deduction,
          data.advance_deduction,
          existing.id
        );
    } else {
      this.db
        .prepare(
          `INSERT INTO salary_structures
            (employee_id, effective_from, basic, dearness_allowance, hra, fixed_allowance,
             conveyance, medical_allowance, other_allowance, professional_tax, epf_employee,
             esi_employee, income_tax, loan_deduction, advance_deduction)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          employeeId,
          data.effective_from,
          data.basic,
          data.dearness_allowance,
          data.hra,
          data.fixed_allowance,
          data.conveyance,
          data.medical_allowance,
          data.other_allowance,
          data.professional_tax,
          data.epf_employee,
          data.esi_employee,
          data.income_tax,
          data.loan_deduction,
          data.advance_deduction
        );
    }
  }
}
