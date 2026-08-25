import Database from "better-sqlite3";

export interface Branch {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export class BranchRepository {
  constructor(private db: Database.Database) {}

  findAll(): Branch[] {
    return this.db.prepare("SELECT * FROM branches ORDER BY name").all() as Branch[];
  }

  create(data: {
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  }): Branch {
    const result = this.db
      .prepare(
        "INSERT INTO branches (name, address, city, state, country) VALUES (?, ?, ?, ?, ?)"
      )
      .run(
        data.name,
        data.address ?? null,
        data.city ?? null,
        data.state ?? null,
        data.country ?? "India"
      );
    return {
      id: Number(result.lastInsertRowid),
      name: data.name,
      address: data.address ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      country: data.country ?? "India"
    };
  }
}
