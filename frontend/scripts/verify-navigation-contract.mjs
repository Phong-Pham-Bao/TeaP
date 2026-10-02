import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDirectory, '..');
const appRoot = join(frontendRoot, 'src', 'app');
const policy = JSON.parse(
  readFileSync(join(frontendRoot, 'src', 'lib', 'route-policy.json'), 'utf8'),
);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function routeForPage(path) {
  const directory = relative(appRoot, dirname(path)).split(sep).filter(Boolean);
  return directory.length === 0 ? '/' : `/${directory.join('/')}`;
}

function sourceRouteForFile(path) {
  const segments = relative(appRoot, path).split(sep);
  const componentIndex = segments.indexOf('components');
  const routeSegments = componentIndex >= 0
    ? segments.slice(0, componentIndex)
    : segments.slice(0, -1);
  return routeSegments.length === 0 ? '/' : `/${routeSegments.join('/')}`;
}

function matchesRoute(entry, route) {
  return entry.match === 'exact'
    ? route === entry.path
    : route === entry.path || route.startsWith(`${entry.path}/`);
}

function policyFor(route) {
  return policy.routes.find((entry) => matchesRoute(entry, route));
}

const roles = new Set(policy.roles);
assert.equal(roles.size, policy.roles.length, 'Role list contains duplicates');
assert.deepEqual(
  new Set(Object.keys(policy.defaultRoutes)),
  roles,
  'Every role must have exactly one default workspace',
);

for (const [role, route] of Object.entries(policy.defaultRoutes)) {
  const entry = policyFor(route);
  assert(entry, `Default workspace ${route} for ${role} has no route policy`);
  assert.notEqual(entry.access, 'public', `Default workspace ${route} must be private`);
  const allowedRoles = entry.access === 'authenticated' ? roles : new Set(entry.roles ?? []);
  assert(allowedRoles.has(role), `${role} cannot access its default workspace ${route}`);
}

for (const entry of policy.routes) {
  assert(entry.path.startsWith('/'), `Route policy must be absolute: ${entry.path}`);
  if (entry.roles) {
    assert.equal(new Set(entry.roles).size, entry.roles.length, `Duplicate roles for ${entry.path}`);
    for (const role of entry.roles) assert(roles.has(role), `Unknown role ${role} for ${entry.path}`);
  } else {
    assert(
      entry.access === 'public' || entry.access === 'authenticated',
      `Route ${entry.path} needs roles or an explicit access mode`,
    );
  }
}

const sourceFiles = walk(appRoot).filter((path) => path.endsWith('.tsx'));
const pageRoutes = new Set(
  sourceFiles.filter((path) => path.endsWith(`${sep}page.tsx`)).map(routeForPage),
);

for (const route of pageRoutes) {
  assert(policyFor(route), `Page ${route} is missing a fail-closed route policy`);
}

const staticLinkPattern = /\bhref\s*(?:=|:)\s*["'](\/[^"'?#]*)["']/g;
const discoveredEdges = [];
for (const path of sourceFiles) {
  const source = sourceRouteForFile(path);
  const content = readFileSync(path, 'utf8');
  for (const match of content.matchAll(staticLinkPattern)) {
    const destination = match[1].replace(/\/$/, '') || '/';
    assert(pageRoutes.has(destination), `${relative(frontendRoot, path)} links to missing route ${destination}`);
    discoveredEdges.push({ source, destination, file: relative(frontendRoot, path) });
  }
}

for (const edge of discoveredEdges) {
  const allowed = policy.allowedStaticNavigation[edge.source] ?? [];
  assert(
    allowed.includes(edge.destination),
    `${edge.file} adds unreviewed navigation ${edge.source} → ${edge.destination}`,
  );
}

for (const [source, destinations] of Object.entries(policy.allowedStaticNavigation)) {
  assert(pageRoutes.has(source), `Navigation source does not exist: ${source}`);
  for (const destination of destinations) {
    assert(pageRoutes.has(destination), `Allowed navigation destination does not exist: ${destination}`);
  }
}

assert.equal(policyFor('/not-a-real-route'), undefined, 'Unknown routes must fail closed');
assert.equal(policyFor('/administrator'), undefined, 'Prefix policies must respect path boundaries');

console.log(
  `Navigation contract OK: ${pageRoutes.size} pages, ${policy.routes.length} policies, ${discoveredEdges.length} static links, ${roles.size} roles.`,
);
