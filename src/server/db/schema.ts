import { createId } from "@paralleldrive/cuid2"
import { relations, sql } from "drizzle-orm"
import {
  boolean,
  index,
  int,
  json,
  mysqlTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar
} from "drizzle-orm/mysql-core"
import { type AdapterAccount } from "next-auth/adapters"

export const mysqlTable = mysqlTableCreator((name) => `trello_clone_${name}`)

// export const workspaces = mysqlTable(
//   'workspaces',
//   {
//     id: varchar('id', { length: 128 })
//       .$defaultFn(() => createId())
//       .primaryKey(),
//     name: varchar('name', { length: 256 }).notNull(),
//     type: mysqlEnum('type', [
//       'small enterprise',
//       'education',
//       'other',
//       'marketing',
//       'RH',
//       'engineer/ti',
//     ]).notNull(),
//     description: text('description'),
//   },
//   (workspaces) => ({
//     nameIdx: index('name_idx').on(workspaces.name),
//   }),
// );

// export const workspaceRelations = relations(workspaces, ({ many }) => ({
//   boards: many(boards),
// }));

export const boards = mysqlTable(
  "boards",
  {
    id: varchar("id", { length: 128 })
      .$defaultFn(() => createId())
      .primaryKey(),
    title: varchar("title", { length: 256 }).notNull(),
    background: json("background"),
    public: boolean("public").default(false),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
    ownerId: varchar("ownerId", { length: 128 }).notNull()
    // workspaceId: varchar('workspaceId', { length: 128 }).references(() => workspaces.id),
  },
  (boards) => ({
    ownerIdIdx: index("ownerId_idx").on(boards.ownerId)
  })
)

export const boardsRelations = relations(boards, ({ one, many }) => ({
  // workspace: one(workspaces, { fields: [boards.workspaceId], references: [workspaces.id] }),
  owner: one(users, { fields: [boards.ownerId], references: [users.id] }),
  lists: many(lists)
}))

export const lists = mysqlTable("lists", {
  id: varchar("id", { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  position: int("position").notNull(),
  boardId: varchar("boardId", { length: 128 })
    .notNull()
    .references(() => boards.id),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow()
})

export const listsRelations = relations(lists, ({ one, many }) => ({
  board: one(boards, { fields: [lists.boardId], references: [boards.id] }),
  cards: many(cards)
}))

export const cards = mysqlTable("cards", {
  id: varchar("id", { length: 128 })
    .$defaultFn(() => createId())
    .primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  listId: varchar("listId", { length: 128 }).notNull(),
  position: int("position").notNull()
})

export const cardsRelations = relations(cards, ({ one }) => ({
  list: one(lists, { fields: [cards.listId], references: [lists.id] })
}))

export const recentlyViewed = mysqlTable(
  "recentlyViewed",
  {
    id: varchar("id", { length: 255 })
      .$defaultFn(() => createId())
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 }),
    boardId: varchar("boardId", { length: 255 }).notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at").onUpdateNow()
  },
  (recentlyViewed) => ({
    compoundKey: primaryKey(recentlyViewed.userId, recentlyViewed.boardId)
  })
)

export const recentlyViewedRelations = relations(recentlyViewed, ({ one }) => ({
  user: one(users, { fields: [recentlyViewed.userId], references: [users.id] }),
  board: one(boards, { fields: [recentlyViewed.boardId], references: [boards.id] })
}))

export const users = mysqlTable("user", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    fsp: 3
  }).default(sql`CURRENT_TIMESTAMP(3)`),
  image: varchar("image", { length: 255 })
})

export const usersRelations = relations(users, ({ many }) => ({
  board: many(boards),
  accounts: many(accounts)
}))

export const accounts = mysqlTable(
  "account",
  {
    userId: varchar("userId", { length: 255 }).notNull(),
    type: varchar("type", { length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 })
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
    userIdIdx: index("userId_idx").on(account.userId)
  })
)

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] })
}))

export const sessions = mysqlTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 }).notNull().primaryKey(),
    userId: varchar("userId", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull()
  },
  (session) => ({
    userIdIdx: index("userId_idx").on(session.userId)
  })
)

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] })
}))

export const verificationTokens = mysqlTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull()
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token)
  })
)
