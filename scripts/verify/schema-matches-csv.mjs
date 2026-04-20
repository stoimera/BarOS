import fs from 'node:fs';
import path from 'node:path';

const csvPath =
  process.env.SUPABASE_SCHEMA_CSV_PATH ||
  path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads', 'Supabase Snippet Schema Documentation Generator (Public Schema).csv');

const tablesSqlPath = path.join(process.cwd(), 'schemas', '03-tables.sql');
const fksSqlPath = path.join(process.cwd(), 'schemas', '04-foreign-keys.sql');
const indexesSqlPath = path.join(process.cwd(), 'schemas', '05-indexes.sql');
const fnTriggersSqlPath = path.join(process.cwd(), 'schemas', '06-functions-and-triggers.sql');
const viewsSqlPath = path.join(process.cwd(), 'schemas', '07-views.sql');
const policiesSqlPath = path.join(process.cwd(), 'schemas', '08-rls-policies.sql');

if (!fs.existsSync(csvPath)) {
  console.error(`schema-matches-csv: missing source CSV at ${csvPath}`);
  process.exit(1);
}
const requiredPaths = [tablesSqlPath, fksSqlPath, indexesSqlPath, fnTriggersSqlPath, viewsSqlPath, policiesSqlPath];
if (requiredPaths.some((p) => !fs.existsSync(p))) {
  console.error('schema-matches-csv: missing one or more canonical schema files (03..08)');
  process.exit(1);
}

const rawCsv = fs.readFileSync(csvPath, 'utf8');
const firstNewline = rawCsv.indexOf('\n');
let body = rawCsv.slice(firstNewline + 1).trim();
if (body.startsWith('"') && body.endsWith('"')) body = body.slice(1, -1);
body = body.replace(/\r/g, '').replace(/""/g, '"');

const csvTables = [...body.matchAll(/^-- TABLE:\s+(public\.[^\s]+)\s+\[RLS ON\]/gm)].map((m) => m[1]);
const csvPolicies = [...body.matchAll(/^\s*policy\s+(.+?)\s+FOR\s+[A-Z]+\s+TO\s+.+$/gm)].map((m) => m[1]);
const csvFkCount = [...body.matchAll(/^\s*-- FK:\s+/gm)].length;
const csvCheckCount = [...body.matchAll(/^\s*-- CHECK:\s+/gm)].length;
const csvIndexCount = [...body.matchAll(/^\s*CREATE INDEX\s+/gm)].length;
const csvTriggerCount = [...body.matchAll(/^\s{2}[a-zA-Z0-9_]+\s+.+\s+->\s+EXECUTE FUNCTION\s+/gm)].length;
const csvViewCount = [...body.matchAll(/^-- VIEW:\s+/gm)].length;
const csvFunctionCount = [...body.matchAll(/^CREATE OR REPLACE FUNCTION\s+/gm)].length;

const tablesSql = fs.readFileSync(tablesSqlPath, 'utf8');
const fksSql = fs.readFileSync(fksSqlPath, 'utf8');
const indexesSql = fs.readFileSync(indexesSqlPath, 'utf8');
const fnTriggersSql = fs.readFileSync(fnTriggersSqlPath, 'utf8');
const viewsSql = fs.readFileSync(viewsSqlPath, 'utf8');
const policiesSql = fs.readFileSync(policiesSqlPath, 'utf8');

const missingTables = csvTables.filter((t) => !tablesSql.includes(`CREATE TABLE IF NOT EXISTS ${t} (`));
const missingPolicies = csvPolicies.filter(
  (p) => !policiesSql.includes(`CREATE POLICY "${p}"`) && !policiesSql.includes(`CREATE POLICY ${p}`),
);
const generatedFkCount = [...fksSql.matchAll(/ADD CONSTRAINT\s+.+_fkey\s+FOREIGN KEY\s*\(/g)].length;
const generatedCheckCount = [...fksSql.matchAll(/ADD CONSTRAINT\s+.+_check_\d+\s+CHECK\s+/g)].length;
const generatedIndexCount = [...indexesSql.matchAll(/^CREATE INDEX\s+/gm)].length;
const generatedTriggerCount = [...fnTriggersSql.matchAll(/^CREATE TRIGGER\s+/gm)].length;
const generatedViewCount = [...viewsSql.matchAll(/^CREATE OR REPLACE VIEW\s+/gm)].length;
const generatedFunctionCount = [...fnTriggersSql.matchAll(/^CREATE OR REPLACE FUNCTION\s+/gm)].length;

const countErrors = [];
if (generatedFkCount !== csvFkCount) countErrors.push(`foreign keys csv=${csvFkCount} generated=${generatedFkCount}`);
if (generatedCheckCount !== csvCheckCount) countErrors.push(`checks csv=${csvCheckCount} generated=${generatedCheckCount}`);
if (generatedIndexCount !== csvIndexCount) countErrors.push(`indexes csv=${csvIndexCount} generated=${generatedIndexCount}`);
if (generatedTriggerCount !== csvTriggerCount) countErrors.push(`triggers csv=${csvTriggerCount} generated=${generatedTriggerCount}`);
if (generatedViewCount !== csvViewCount) countErrors.push(`views csv=${csvViewCount} generated=${generatedViewCount}`);
if (generatedFunctionCount !== csvFunctionCount) countErrors.push(`functions csv=${csvFunctionCount} generated=${generatedFunctionCount}`);

if (missingTables.length || missingPolicies.length || countErrors.length) {
  if (missingTables.length) {
    console.error(`schema-matches-csv: missing tables (${missingTables.length})`);
    for (const table of missingTables.slice(0, 20)) console.error(`  - ${table}`);
  }
  if (missingPolicies.length) {
    console.error(`schema-matches-csv: missing policies (${missingPolicies.length})`);
    for (const policy of missingPolicies.slice(0, 20)) console.error(`  - ${policy}`);
  }
  if (countErrors.length) {
    console.error('schema-matches-csv: section count mismatches');
    for (const err of countErrors) console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `schema-matches-csv: OK (${csvTables.length} tables, ${csvPolicies.length} policies, ${csvFkCount} fks, ${csvCheckCount} checks, ${csvIndexCount} indexes, ${csvTriggerCount} triggers, ${csvViewCount} views, ${csvFunctionCount} functions)`,
);
