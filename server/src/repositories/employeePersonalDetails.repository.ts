import Database from "better-sqlite3";

export interface PersonalDetails {
  employee_id: number;
  father_name: string | null;
  mother_name: string | null;
  spouse_name: string | null;
  religion: string | null;
  personal_email: string | null;
  personal_mobile: string | null;
  alternate_mobile: string | null;
  current_address: string | null;
  permanent_address: string | null;
  same_as_permanent: number;
  city: string | null;
  state: string | null;
  country: string | null;
  pin_code: string | null;
}

export type PersonalDetailsInput = Omit<PersonalDetails, "employee_id">;

export class PersonalDetailsRepository {
  constructor(private db: Database.Database) {}

  find(employeeId: number): PersonalDetails | undefined {
    return this.db
      .prepare("SELECT * FROM employee_personal_details WHERE employee_id = ?")
      .get(employeeId) as PersonalDetails | undefined;
  }

  upsert(employeeId: number, data: PersonalDetailsInput): void {
    const exists = this.find(employeeId);
    const payload = { ...data, employee_id: employeeId };
    if (exists) {
      this.db
        .prepare(
          `UPDATE employee_personal_details SET
            father_name=@father_name, mother_name=@mother_name, spouse_name=@spouse_name,
            religion=@religion, personal_email=@personal_email, personal_mobile=@personal_mobile,
            alternate_mobile=@alternate_mobile, current_address=@current_address,
            permanent_address=@permanent_address, same_as_permanent=@same_as_permanent,
            city=@city, state=@state, country=@country, pin_code=@pin_code
           WHERE employee_id=@employee_id`
        )
        .run(payload);
    } else {
      this.db
        .prepare(
          `INSERT INTO employee_personal_details
            (employee_id, father_name, mother_name, spouse_name, religion, personal_email,
             personal_mobile, alternate_mobile, current_address, permanent_address,
             same_as_permanent, city, state, country, pin_code)
           VALUES (@employee_id, @father_name, @mother_name, @spouse_name, @religion,
             @personal_email, @personal_mobile, @alternate_mobile, @current_address,
             @permanent_address, @same_as_permanent, @city, @state, @country, @pin_code)`
        )
        .run(payload);
    }
  }
}
