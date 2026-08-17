import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

export function runSeed(db: Database.Database): void {
  seedDepartments(db);
  seedDesignations(db);
  seedBranches(db);
  seedShifts(db);
  seedLeaveTypes(db);
  const adminUserId = seedAdminUser(db);
  seedSampleEmployee(db, adminUserId);
}

function getOrInsert(
  db: Database.Database,
  table: string,
  uniqueColumn: string,
  uniqueValue: string,
  insertSql: string,
  insertParams: unknown[]
): number {
  const existing = db
    .prepare(`SELECT id FROM ${table} WHERE ${uniqueColumn} = ?`)
    .get(uniqueValue) as { id: number } | undefined;
  if (existing) return existing.id;

  const result = db.prepare(insertSql).run(...insertParams);
  return Number(result.lastInsertRowid);
}

function seedDepartments(db: Database.Database) {
  ["Design", "Human Resources", "Accounts", "Production"].forEach((name) => {
    getOrInsert(db, "departments", "name", name, "INSERT INTO departments (name) VALUES (?)", [
      name
    ]);
  });
}

function seedDesignations(db: Database.Database) {
  ["Design Engineer", "HR Executive", "Accountant", "Production Supervisor"].forEach((title) => {
    getOrInsert(
      db,
      "designations",
      "title",
      title,
      "INSERT INTO designations (title) VALUES (?)",
      [title]
    );
  });
}

function seedBranches(db: Database.Database) {
  getOrInsert(
    db,
    "branches",
    "name",
    "Chennai - Head Office",
    "INSERT INTO branches (name, address, city, state, country) VALUES (?, ?, ?, ?, ?)",
    [
      "Chennai - Head Office",
      "28 New Boag Road, CIT Nagar, Kannamapet",
      "Chennai",
      "Tamil Nadu",
      "India"
    ]
  );
}

function seedShifts(db: Database.Database) {
  getOrInsert(
    db,
    "shifts",
    "name",
    "General Shift",
    "INSERT INTO shifts (name, start_time, end_time, grace_minutes) VALUES (?, ?, ?, ?)",
    ["General Shift", "09:30", "18:30", 10]
  );
}

function seedLeaveTypes(db: Database.Database) {
  const types: Array<[string, number, number]> = [
    ["Casual Leave", 1, 12],
    ["Sick Leave", 1, 12],
    ["Earned Leave", 1, 15],
    ["Loss of Pay", 0, 0],
    ["Maternity Leave", 1, 182],
    ["Paternity Leave", 1, 15],
    ["Comp Off", 1, 0],
    ["Imported Leave (Historical)", 1, 0]
  ];
  types.forEach(([name, paid, days]) => {
    getOrInsert(
      db,
      "leave_types",
      "name",
      name,
      "INSERT INTO leave_types (name, paid, default_annual_days) VALUES (?, ?, ?)",
      [name, paid, days]
    );
  });
}

function seedAdminUser(db: Database.Database): number {
  const email = "admin@industrialfans.local";
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as
    | { id: number }
    | undefined;
  if (existing) return existing.id;

  const passwordHash = bcrypt.hashSync("Admin@123", 10);
  const result = db
    .prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'ADMIN')")
    .run(email, passwordHash);

  console.log(
    `[seed] created default admin user -> email: ${email} / password: Admin@123`
  );
  return Number(result.lastInsertRowid);
}

function seedSampleEmployee(db: Database.Database, adminUserId: number) {
  const employeeCode = "INDF0026";
  const existing = db
    .prepare("SELECT id FROM employees WHERE employee_code = ?")
    .get(employeeCode) as { id: number } | undefined;
  if (existing) return;

  const designationId = db
    .prepare("SELECT id FROM designations WHERE title = 'Design Engineer'")
    .get() as { id: number };
  const branchId = db
    .prepare("SELECT id FROM branches WHERE name = 'Chennai - Head Office'")
    .get() as { id: number };
  const shiftId = db.prepare("SELECT id FROM shifts WHERE name = 'General Shift'").get() as {
    id: number;
  };
  const departmentId = db.prepare("SELECT id FROM departments WHERE name = 'Design'").get() as {
    id: number;
  };

  const employeeResult = db
    .prepare(
      `INSERT INTO employees
        (employee_code, full_name, designation_id, department_id, branch_id, shift_id, date_of_joining, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`
    )
    .run(
      employeeCode,
      "AJEES KHAN M",
      designationId.id,
      departmentId.id,
      branchId.id,
      shiftId.id,
      "2023-06-12"
    );

  const employeeId = Number(employeeResult.lastInsertRowid);

  db.prepare(
    `INSERT INTO salary_structures
      (employee_id, effective_from, basic, dearness_allowance, hra, fixed_allowance,
       professional_tax, epf_employee)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(employeeId, "2023-06-12", 7500, 1500, 2250, 13750, 208, 1800);

  console.log(`[seed] created sample employee ${employeeCode} - AJEES KHAN M`);
  void adminUserId;
}
