CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"pickup_address" text NOT NULL,
	"destination_address" text NOT NULL,
	"pickup_lat" real,
	"pickup_lng" real,
	"destination_lat" real,
	"destination_lng" real,
	"scheduled_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"service_type" text NOT NULL,
	"vehicle_id" integer,
	"driver_id" integer,
	"total_price" real NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"license_number" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"rating" real DEFAULT 4.8 NOT NULL,
	"total_moves" integer DEFAULT 0 NOT NULL,
	"city" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"plate_number" text NOT NULL,
	"model" text NOT NULL,
	"type" text NOT NULL,
	"capacity" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"current_city" text NOT NULL,
	"current_lat" real,
	"current_lng" real,
	"fuel_level" integer DEFAULT 100 NOT NULL,
	"mileage" integer DEFAULT 0 NOT NULL,
	"last_service_date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"pickup_address" text NOT NULL,
	"destination_address" text NOT NULL,
	"apartment_size" text NOT NULL,
	"rooms" integer NOT NULL,
	"floor_pickup" integer DEFAULT 0 NOT NULL,
	"floor_destination" integer DEFAULT 0 NOT NULL,
	"has_elevator" boolean DEFAULT false NOT NULL,
	"needs_storage" boolean DEFAULT false NOT NULL,
	"needs_packing" boolean DEFAULT false NOT NULL,
	"needs_assembly" boolean DEFAULT false NOT NULL,
	"urgency_level" text DEFAULT 'standard' NOT NULL,
	"estimated_price" real DEFAULT 0 NOT NULL,
	"estimated_truck_size" text DEFAULT 'small_truck' NOT NULL,
	"estimated_crew" integer DEFAULT 2 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"base_price" real NOT NULL,
	"estimated_duration" text NOT NULL,
	"icon" text NOT NULL,
	"features" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "services_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_name" text,
	"business_phone_number_id" text NOT NULL,
	"latest_message_text" text DEFAULT '' NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_inbound_at" timestamp with time zone,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"direction" text NOT NULL,
	"text" text NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"provider_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_messages_provider_message_id_unique" UNIQUE("provider_message_id")
);
--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_conversations_phone_business_unique" ON "whatsapp_conversations" USING btree ("customer_phone","business_phone_number_id");--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_last_message_idx" ON "whatsapp_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_conversation_created_idx" ON "whatsapp_messages" USING btree ("conversation_id","created_at");