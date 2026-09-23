import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
export const stations = sqliteTable('stations', {
  seq: integer('seq').primaryKey({ autoIncrement: true }),
  id: text('id').notNull().unique(),
  stationKey: text('station_key').notNull().unique(),
  payload: text('payload').notNull(),
});
export const inspections = sqliteTable(
  'inspections',
  {
    seq: integer('seq').primaryKey({ autoIncrement: true }),
    id: text('id').notNull().unique(),
    businessKey: text('business_key').notNull(),
    stationId: text('station_id')
      .notNull()
      .references(() => stations.id),
    payload: text('payload').notNull(),
  },
  (t) => [uniqueIndex('inspections_business_key').on(t.businessKey)],
);
