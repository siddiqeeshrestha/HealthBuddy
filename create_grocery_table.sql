CREATE TABLE grocery_lists (
id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
user_id varchar NOT NULL,
name text NOT NULL,
items jsonb NOT NULL,
created_at timestamp DEFAULT now() NOT NULL,
updated_at timestamp DEFAULT now() NOT NULL
);
ALTER TABLE grocery_lists ADD CONSTRAINT grocery_lists_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
