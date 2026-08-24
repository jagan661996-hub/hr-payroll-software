import Database from "better-sqlite3";

export interface Identity {
  employee_id: number;
  pan_number: string | null;
  aadhaar_number: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  driving_licence_number: string | null;
  driving_licence_expiry: string | null;
  voter_id: string | null;
  uan_number: string | null;
  pf_number: string | null;
  esi_number: string | null;
}

export type IdentityInput = Omit<Identity, "employee_id">;

export class IdentityRepository {
  constructor(private db: Database.Database) {}

  find(employeeId: number): Identity | undefined {
    return this.db.prepare("SELECT * FROM employee_identity WHERE employee_id = ?").get(
      employeeId
    ) as Identity | undefined;
  }

  upsert(employeeId: number, data: IdentityInput): void {
    const exists = this.find(employeeId);
    const payload = { ...data, employee_id: employeeId };
    if (exists) {
      this.db
        .prepare(
          `UPDATE employee_identity SET
            pan_number=@pan_number, aadhaar_number=@aadhaar_number, passport_number=@passport_number,
            passport_expiry=@passport_expiry, driving_licence_number=@driving_licence_number,
            driving_licence_expiry=@driving_licence_expiry, voter_id=@voter_id,
            uan_number=@uan_number, pf_number=@pf_number, esi_number=@esi_number
           WHERE employee_id=@employee_id`
        )
        .run(payload);
    } else {
      this.db
        .prepare(
          `INSERT INTO employee_identity
            (employee_id, pan_number, aadhaar_number, passport_number, passport_expiry,
             driving_licence_number, driving_licence_expiry, voter_id, uan_number, pf_number, esi_number)
           VALUES (@employee_id, @pan_number, @aadhaar_number, @passport_number, @passport_expiry,
             @driving_licence_number, @driving_licence_expiry, @voter_id, @uan_number, @pf_number, @esi_number)`
        )
        .run(payload);
    }
  }
}

// PAN: XXXXX1234X (only the 4-digit middle segment shown - PAN numbers
// are always 5 letters + 4 digits + 1 letter, so this reveals the
// digits and masks both letter segments) / Aadhaar: XXXX XXXX 1234
// (last 4 digits shown) - matches the exact masked formats given in
// the module spec.
function maskPan(pan: string | null): string | null {
  if (!pan) return pan;
  if (pan.length === 10) {
    return "XXXXX" + pan.slice(5, 9) + "X";
  }
  return maskKeepingLast(pan, 4); // fallback for any non-standard-length value
}

function maskKeepingLast(value: string | null, visibleCount: number): string | null {
  if (!value) return value;
  if (value.length <= visibleCount) return value;
  return "X".repeat(value.length - visibleCount) + value.slice(-visibleCount);
}

export function maskIdentity(identity: Identity): Identity {
  return {
    ...identity,
    pan_number: maskPan(identity.pan_number),
    aadhaar_number: identity.aadhaar_number
      ? `XXXX XXXX ${identity.aadhaar_number.replace(/\s/g, "").slice(-4)}`
      : identity.aadhaar_number,
    passport_number: maskKeepingLast(identity.passport_number, 3),
    driving_licence_number: maskKeepingLast(identity.driving_licence_number, 4),
    voter_id: maskKeepingLast(identity.voter_id, 4),
    uan_number: maskKeepingLast(identity.uan_number, 4)
  };
}
