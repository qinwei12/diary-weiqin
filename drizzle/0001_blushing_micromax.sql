CREATE TABLE "AlbumImage" (
	"id" text PRIMARY KEY NOT NULL,
	"objectKey" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"bytes" integer NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"accent" text NOT NULL,
	"palette" text[] NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "AlbumImage_objectKey_key" ON "AlbumImage" USING btree ("objectKey");--> statement-breakpoint
CREATE INDEX "AlbumImage_createdAt_idx" ON "AlbumImage" USING btree ("createdAt" DESC NULLS LAST);