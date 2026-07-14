## Task: Generate 100 Dummy Data using Faker.js → Supabase

### Step 1 - Read Schema
Read the Prisma schema file at `prisma/schema.prisma`.
Analyze all models, field types, relations, and constraints (e.g. @unique, @default, enums, optional fields).

### Step 2 - Plan
Before writing any code, list:
- All tables/models you found
- The order of insertion (respecting foreign key / relation dependencies)
- Which fields to skip (e.g. auto-generated: @id @default(uuid()), @default(now()), updatedAt)
- Which fields need realistic fake data vs random values

### Step 3 - Install Dependencies
Make sure the following packages are installed:
- @faker-js/faker
- @supabase/supabase-js
- dotenv

Use `service_role` key (not anon key) so RLS is bypassed during seeding.

### Step 5 - Write the Seed Script
Create a file `scripts/seed.js` with the following requirements:
- Use ESM (`import`) syntax
- Import `{ faker }` from `@faker-js/faker`
- Import Supabase client using the service_role key
- Generate exactly 100 records per table (unless a table is a join/relation table — adjust count accordingly)
- Insert data in the correct order to satisfy foreign key constraints
- Use `faker.helpers.multiple()` where possible
- Use `supabase.from('table').insert(data)` for insertion
- After each table insert, log success/error to console
- Wrap everything in a `main()` async function with try/catch

### Step 6 - Add Script to package.json
Add this to `package.json` scripts:
```json
"seed": "node scripts/seed.js"
```

### Step 7 - Run & Verify
Run the seed script:
npm run seed

Then verify in Supabase Table Editor that all tables have been populated correctly.

### Important Rules
- DO NOT truncate or delete existing data unless I explicitly ask
- DO NOT modify the Prisma schema
- DO NOT use prisma client for insertion — use Supabase JS client directly
- If a field has an enum type in Prisma, use `faker.helpers.arrayElement([...enum values])`
- If a field is optional, randomly decide whether to include it using `faker.datatype.boolean()`
- Keep all foreign key references valid (e.g. pick random IDs from already-inserted records)