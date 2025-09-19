CREATE TABLE "health_plan_targets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_type" text NOT NULL,
	"target_value" numeric NOT NULL,
	"target_unit" text NOT NULL,
	"current_value" numeric DEFAULT '0',
	"is_completed" boolean DEFAULT false,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "health_plan_targets" ADD CONSTRAINT "health_plan_targets_plan_id_health_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."health_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_plan_targets" ADD CONSTRAINT "health_plan_targets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;