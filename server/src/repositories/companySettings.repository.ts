import Database from "better-sqlite3";

export interface CompanySettings {
  id: 1;
  company_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  financial_year_start_month: number;
}

export class CompanySettingsRepository {
  constructor(private db: Database.Database) {}

  get(): CompanySettings {
    return this.db.prepare("SELECT * FROM company_settings WHERE id = 1").get() as CompanySettings;
  }

  update(data: Omit<CompanySettings, "id">): CompanySettings {
    this.db
      .prepare(
        `UPDATE company_settings SET
          company_name = ?, address = ?, city = ?, state = ?, country = ?, financial_year_start_month = ?
         WHERE id = 1`
      )
      .run(
        data.company_name,
        data.address,
        data.city,
        data.state,
        data.country,
        data.financial_year_start_month
      );
    return this.get();
  }
}
