CREATE TABLE "connected_accounts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"provider" varchar NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expires_at" timestamp with time zone,
	"external_user_id" varchar,
	"scopes" varchar,
	"status" varchar DEFAULT 'connected' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_entries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"entry_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_imports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"kind" varchar NOT NULL,
	"status" varchar NOT NULL,
	"source_payload" jsonb,
	"error_message" text,
	"imported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metric_entries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"daily_entry_id" bigint NOT NULL,
	"metric_type" varchar NOT NULL,
	"source" varchar NOT NULL,
	"value_decimal" numeric(12, 4),
	"value_text" text,
	"value_boolean" boolean,
	"unit" varchar,
	"recorded_at" timestamp with time zone NOT NULL,
	"notes" text,
	"confidence" numeric(4, 3),
	"preferred_source" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metric_entries_exactly_one_value" CHECK (num_nonnulls("metric_entries"."value_decimal", "metric_entries"."value_text", "metric_entries"."value_boolean") = 1)
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"preferred_units" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"preferred_source_by_metric" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"goal_notes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"theme" varchar DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_imports" ADD CONSTRAINT "data_imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_daily_entry_id_daily_entries_id_fk" FOREIGN KEY ("daily_entry_id") REFERENCES "public"."daily_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "index_connected_accounts_on_user_id_and_provider" ON "connected_accounts" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "index_daily_entries_on_user_id_and_entry_date" ON "daily_entries" USING btree ("user_id","entry_date");--> statement-breakpoint
CREATE INDEX "index_metric_entries_on_daily_entry_id_metric_type_recorded_at" ON "metric_entries" USING btree ("daily_entry_id","metric_type","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "index_user_settings_on_user_id" ON "user_settings" USING btree ("user_id");