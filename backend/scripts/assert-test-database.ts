const databaseUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV !== 'test') {
  throw new Error('Refusing database test: NODE_ENV must be exactly "test"');
}

if (!databaseUrl) {
  throw new Error('Refusing database test: DATABASE_URL is missing');
}

const parsed = new URL(databaseUrl);
const databaseName = parsed.pathname.replace(/^\//, '').toLowerCase();
const allowedHosts = new Set(['localhost', '127.0.0.1', 'postgres']);

if (!allowedHosts.has(parsed.hostname.toLowerCase())) {
  throw new Error(
    `Refusing database test: host "${parsed.hostname}" is not an approved local test host`,
  );
}

if (!databaseName.endsWith('_test')) {
  throw new Error(
    `Refusing database test: database "${databaseName}" must end with "_test"`,
  );
}

console.log(`Database test guard passed for ${parsed.hostname}/${databaseName}`);
