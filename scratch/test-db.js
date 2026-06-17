const { Client } = require('../../sewaki-monolith/node_modules/pg');

const client = new Client({
  connectionString: 'postgresql://postgres.bjhugpdhadngtabbgkbb:YyuYnILSDfxa93Ex@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM items LIMIT 1');
  console.log('Columns:', res.fields.map(f => f.name));
  await client.end();
}

main().catch(console.error);
