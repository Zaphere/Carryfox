import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const whatsappConversationsTable = pgTable(
  "whatsapp_conversations",
  {
    id: serial("id").primaryKey(),
    customerPhone: text("customer_phone").notNull(),
    customerName: text("customer_name"),
    businessPhoneNumberId: text("business_phone_number_id").notNull(),
    latestMessageText: text("latest_message_text").notNull().default(""),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastInboundAt: timestamp("last_inbound_at", { withTimezone: true }),
    unreadCount: integer("unread_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("whatsapp_conversations_phone_business_unique").on(
      table.customerPhone,
      table.businessPhoneNumberId,
    ),
    index("whatsapp_conversations_last_message_idx").on(table.lastMessageAt),
  ],
);

export const whatsappMessagesTable = pgTable(
  "whatsapp_messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => whatsappConversationsTable.id, { onDelete: "cascade" }),
    direction: text("direction").notNull(),
    text: text("text").notNull(),
    status: text("status").notNull().default("received"),
    providerMessageId: text("provider_message_id").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("whatsapp_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);
