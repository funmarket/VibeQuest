import type { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import type { Place, PlacesQuery, PlacesRepository } from "@vq/contracts";

export function createPlacesRepository(pool: Pool): PlacesRepository {
  const db = drizzle(pool);
  return {
    async listPublished(query: PlacesQuery): Promise<Place[]> {
      const category = query.category
        ? sql`AND category = ${query.category}`
        : sql``;
      const search = query.q
        ? sql`AND strpos(lower(name), lower(${query.q})) > 0`
        : sql``;
      const result = await db.execute(sql`
      SELECT id, name, category, ST_X(location) AS longitude, ST_Y(location) AS latitude,
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM places WHERE publication_status = 'published'
      AND ST_Covers(ST_MakeEnvelope(${query.west}, ${query.south}, ${query.east}, ${query.north}, 4326), location)
      ${category} ${search} ORDER BY created_at DESC, id LIMIT ${query.limit}`);
      return result.rows.map(
        (row) =>
          ({
            ...row,
            createdAt: new Date(row.createdAt as string).toISOString(),
            updatedAt: new Date(row.updatedAt as string).toISOString(),
          }) as Place,
      );
    },
  };
}
