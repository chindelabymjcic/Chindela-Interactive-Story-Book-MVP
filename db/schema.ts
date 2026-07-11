import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  boolean,
  date,
  decimal,
} from "drizzle-orm/mysql-core";

// ============== USERS ==============
// Platform-managed parent and administrator accounts.
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["admin", "parent"]).default("parent").notNull(),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============== AGE GROUPS ==============
export const ageGroups = mysqlTable("age_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // "3-4 years", "5-7 years", etc.
  minAge: int("min_age").notNull(),
  maxAge: int("max_age").notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#FFB347"), // Theme color for UI
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgeGroup = typeof ageGroups.$inferSelect;
export type InsertAgeGroup = typeof ageGroups.$inferInsert;

// ============== CHILDREN ==============
// Child accounts - linked to parent users
export const children = mysqlTable("children", {
  id: serial("id").primaryKey(),
  parentId: bigint("parent_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  pinHash: varchar("pin_hash", { length: 255 }).notNull(),
  avatar: text("avatar"),
  ageGroupId: bigint("age_group_id", { mode: "number", unsigned: true }).notNull(),
  age: int("age").notNull(),
  favoriteCharacter: varchar("favorite_character", { length: 100 }),
  streakDays: int("streak_days").default(0),
  totalEntries: int("total_entries").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Child = typeof children.$inferSelect;
export type InsertChild = typeof children.$inferInsert;

// ============== CONTENT YEARS ==============
export const contentYears = mysqlTable("content_years", {
  id: serial("id").primaryKey(),
  year: int("year").notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(), // e.g., "2025 - Year of Kindness"
  isActive: boolean("is_active").default(true).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentYear = typeof contentYears.$inferSelect;
export type InsertContentYear = typeof contentYears.$inferInsert;

// ============== CHARACTERS ==============
export const characters = mysqlTable("characters", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // "chindela", "silibidi", etc.
  description: text("description"),
  imageUrl: text("image_url"),
  color: varchar("color", { length: 20 }).default("#FFB347"),
  personality: text("personality"),
  catchphrase: varchar("catchphrase", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;

// ============== STORIES ==============
export const stories = mysqlTable("stories", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  ageGroupId: bigint("age_group_id", { mode: "number", unsigned: true }).notNull(),
  contentYearId: bigint("content_year_id", { mode: "number", unsigned: true }).notNull(),
  characterId: bigint("character_id", { mode: "number", unsigned: true }),
  dayNumber: int("day_number").notNull(), // Day 1-365
  coverImage: text("cover_image"),
  theme: varchar("theme", { length: 255 }),
  moralLesson: text("moral_lesson"),
  isActive: boolean("is_active").default(true).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;

// ============== LESSONS ==============
export const lessons = mysqlTable("lessons", {
  id: serial("id").primaryKey(),
  storyId: bigint("story_id", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  pageNumber: int("page_number").notNull(),
  imageUrl: text("image_url"),
  audioUrl: text("audio_url"),
  characterDialogue: text("character_dialogue"),
  interactiveElement: varchar("interactive_element", { length: 100 }), // "quiz", "activity", "reflection"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

// ============== SAFETY HEADERS ==============
export const safetyHeaders = mysqlTable("safety_headers", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  ageGroupId: bigint("age_group_id", { mode: "number", unsigned: true }),
  isGlobal: boolean("is_global").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SafetyHeader = typeof safetyHeaders.$inferSelect;
export type InsertSafetyHeader = typeof safetyHeaders.$inferInsert;

// ============== MEDIA ==============
export const media = mysqlTable("media", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  url: text("url").notNull(),
  size: bigint("size", { mode: "number" }),
  type: mysqlEnum("type", ["image", "audio", "video"]).notNull(),
  storyId: bigint("story_id", { mode: "number", unsigned: true }),
  lessonId: bigint("lesson_id", { mode: "number", unsigned: true }),
  characterId: bigint("character_id", { mode: "number", unsigned: true }),
  uploadedBy: bigint("uploaded_by", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;

// ============== DIARY ENTRIES ==============
export const diaryEntries = mysqlTable("diary_entries", {
  id: serial("id").primaryKey(),
  childId: bigint("child_id", { mode: "number", unsigned: true }).notNull(),
  storyId: bigint("story_id", { mode: "number", unsigned: true }),
  lessonId: bigint("lesson_id", { mode: "number", unsigned: true }),
  textContent: text("text_content"),
  audioUrl: text("audio_url"),
  imageUrl: text("image_url"),
  mood: varchar("mood", { length: 50 }), // "happy", "sad", "excited", "calm"
  entryDate: date("entry_date").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = typeof diaryEntries.$inferInsert;

// ============== AI FEEDBACK ==============
export const aiFeedback = mysqlTable("ai_feedback", {
  id: serial("id").primaryKey(),
  entryId: bigint("entry_id", { mode: "number", unsigned: true }).notNull().unique(),
  childId: bigint("child_id", { mode: "number", unsigned: true }).notNull(),
  positiveFeedback: text("positive_feedback").notNull(),
  reflectionGuidance: text("reflection_guidance"),
  encouragement: text("encouragement"),
  safeSuggestions: text("safe_suggestions"),
  characterName: varchar("character_name", { length: 100 }),
  isDelivered: boolean("is_delivered").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIFeedback = typeof aiFeedback.$inferSelect;
export type InsertAIFeedback = typeof aiFeedback.$inferInsert;

// ============== NOTIFICATIONS ==============
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(), // Parent or Admin
  childId: bigint("child_id", { mode: "number", unsigned: true }),
  type: mysqlEnum("type", [
    "diary_entry",
    "ai_feedback",
    "subscription_expiry",
    "safety_alert",
    "milestone",
    "system",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  isEmailSent: boolean("is_email_sent").default(false).notNull(),
  relatedId: bigint("related_id", { mode: "number", unsigned: true }), // Related record ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============== SUBSCRIPTIONS ==============
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  parentId: bigint("parent_id", { mode: "number", unsigned: true }).notNull(),
  childId: bigint("child_id", { mode: "number", unsigned: true }).notNull(),
  ageGroupId: bigint("age_group_id", { mode: "number", unsigned: true }).notNull(),
  duration: int("duration").notNull(), // 1, 3, 6, or 12 months
  pricePerMonth: decimal("price_per_month", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("GBP").notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled", "pending"]).default("pending").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  isAutoRenew: boolean("is_auto_renew").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ============== PAYMENTS ==============
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  subscriptionId: bigint("subscription_id", { mode: "number", unsigned: true }).notNull(),
  parentId: bigint("parent_id", { mode: "number", unsigned: true }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("GBP").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  paymentMethod: varchar("payment_method", { length: 100 }),
  paidAt: timestamp("paid_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ============== CHILD PROGRESS ==============
export const childProgress = mysqlTable("child_progress", {
  id: serial("id").primaryKey(),
  childId: bigint("child_id", { mode: "number", unsigned: true }).notNull(),
  storyId: bigint("story_id", { mode: "number", unsigned: true }).notNull(),
  lessonId: bigint("lesson_id", { mode: "number", unsigned: true }),
  progress: int("progress").default(0).notNull(), // 0-100
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ChildProgress = typeof childProgress.$inferSelect;
export type InsertChildProgress = typeof childProgress.$inferInsert;
