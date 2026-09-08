import { pgTable, text, boolean, timestamp, integer, real, jsonb, serial } from "drizzle-orm/pg-core";

export const users = pgTable("gx_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Membro do ecossistema"),
  company: text("company").notNull().default("Grupo X"),
  avatar: text("avatar").notNull().default(""),
  color: text("color").notNull().default("#c7a66e"),
  roomId: text("room_id").notNull().default("recepcao"),
  status: text("status").notNull().default("available"),
  x: real("x").notNull().default(61),
  y: real("y").notNull().default(73),
  isDemo: boolean("is_demo").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  accessToken: text("access_token"),
  handRaised: boolean("hand_raised").notNull().default(false),
  callRoom: text("call_room"),
  micEnabled: boolean("mic_enabled").notNull().default(false),
  cameraEnabled: boolean("camera_enabled").notNull().default(false),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
});

export const rooms = pgTable("gx_rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  kind: text("kind").notNull(),
  capacity: integer("capacity").notNull().default(8),
  color: text("color").notNull(),
});

export const messages = pgTable("gx_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text("sender_id").notNull().references(() => users.id),
  roomId: text("room_id").notNull().default("geral"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetings = pgTable("gx_meetings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  roomId: text("room_id").notNull().references(() => rooms.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  duration: integer("duration").notNull().default(30),
  organizerId: text("organizer_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const signals = pgTable("gx_signals", {
  id: serial("id").primaryKey(),
  fromId: text("from_id").notNull(),
  toId: text("to_id").notNull(),
  roomId: text("room_id").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invitations = pgTable("gx_invitations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdBy: text("created_by").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
