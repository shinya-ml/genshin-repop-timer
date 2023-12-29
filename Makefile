DB?=genshin-repop-timer

MIGRATION_NAME?=new
migration/new:
	npx wrangler d1 migrations create $(DB) $(MIGRATION_NAME)

migration/list:
	npx wrangler d1 migrations list $(DB)

migration/apply:
	npx wrangler d1 migrations apply $(DB)