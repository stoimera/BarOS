import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const csvPath = process.argv[2];
if (!csvPath) {
  throw new Error('Usage: node scripts/tools/generate-canonical-schema-from-csv.mjs "<csv-path>"');
}

function decodeCsvPayload(rawCsv) {
  const firstNewline = rawCsv.indexOf('\n');
  let body = rawCsv.slice(firstNewline + 1).trim();
  if (body.startsWith('"') && body.endsWith('"')) {
    body = body.slice(1, -1);
  }
  return body.replace(/\r/g, '').replace(/""/g, '"');
}

function parseSchema(body) {
  const lines = body.split('\n');
  const result = {
    tables: [],
    views: [],
    functions: [],
    enumsAndTypes: [],
    grants: [],
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    const tableMatch = line.match(/^-- TABLE:\s+([^\s]+)\s+\[RLS ON\]/);
    if (tableMatch) {
      const table = {
        name: tableMatch[1],
        columns: [],
        checks: [],
        fks: [],
        indexes: [],
        policies: [],
        triggers: [],
      };
      let mode = '';
      for (let j = i + 1; j < lines.length; j += 1) {
        const current = lines[j];
        if (
          current.startsWith('-- TABLE:') ||
          current.startsWith('-- VIEW:') ||
          current.startsWith('-- FUNCTION:') ||
          current.startsWith('================================================================')
        ) {
          i = j - 1;
          break;
        }
        if (current === 'Columns:') mode = 'columns';
        else if (current === 'Check constraints:') mode = 'checks';
        else if (current === 'Foreign keys:') mode = 'fks';
        else if (current === 'Indexes:') mode = 'indexes';
        else if (current === 'RLS policies:') mode = 'policies';
        else if (current === 'Triggers:') mode = 'triggers';
        else if (current.trim() === '') mode = '';
        else if (mode === 'columns' && current.startsWith('  ')) table.columns.push(current.trim());
        else if (mode === 'checks' && current.includes('-- CHECK:')) table.checks.push(current.trim().replace(/^--\s*CHECK:\s*/, ''));
        else if (mode === 'fks' && current.includes('-- FK:')) table.fks.push(current.trim().replace(/^--\s*/, ''));
        else if (mode === 'indexes' && current.trim().startsWith('CREATE INDEX')) table.indexes.push(current.trim());
        else if (mode === 'policies' && current.trim().startsWith('policy ')) {
          const policyHead = current.trim();
          const clauses = [lines[j + 1]?.trim(), lines[j + 2]?.trim(), lines[j + 3]?.trim()].filter(
            (clause) => typeof clause === 'string' && (clause.startsWith('USING ') || clause.startsWith('WITH CHECK ')),
          );
          table.policies.push({ policyHead, clauses });
        } else if (mode === 'triggers' && current.startsWith('  ')) {
          table.triggers.push(current.trim());
        }
        if (j === lines.length - 1) i = j;
      }
      result.tables.push(table);
      continue;
    }

    const viewMatch = line.match(/^-- VIEW:\s+([^\s]+)$/);
    if (viewMatch) {
      const statement = [];
      for (let j = i + 1; j < lines.length; j += 1) {
        const current = lines[j];
        if (
          current.startsWith('================================================================') ||
          current.startsWith('-- FUNCTION:') ||
          current.startsWith('-- VIEW:')
        ) {
          i = j - 1;
          break;
        }
        if (current.startsWith('-- ------------------------------------------------------------')) continue;
        if (current.trim()) statement.push(current);
        if (current.trim().endsWith(';')) {
          i = j;
          break;
        }
      }
      result.views.push({ name: viewMatch[1], selectSql: statement.join('\n') });
      continue;
    }

    if (line.startsWith('-- FUNCTION:')) {
      for (let j = i + 1; j < lines.length; j += 1) {
        if (lines[j].startsWith('CREATE OR REPLACE FUNCTION ')) {
          const fnLines = [lines[j]];
          for (let k = j + 1; k < lines.length; k += 1) {
            fnLines.push(lines[k]);
            if (lines[k].trim() === '$function$') {
              const last = lines[k + 1]?.trim() || '';
              if (last === ';') {
                fnLines.push(';');
                i = k + 1;
              } else {
                i = k;
              }
              break;
            }
          }
          let sql = fnLines.join('\n').trim();
          if (!sql.endsWith(';')) sql = `${sql};`;
          result.functions.push(sql);
          break;
        }
      }
      continue;
    }

    if (/^CREATE TYPE\s+/i.test(line)) result.enumsAndTypes.push(line);
    if (/^GRANT\s+/i.test(line)) result.grants.push(line);
  }

  return result;
}

function makeConstraintName(tableName, prefix, index) {
  const short = tableName.split('.').pop();
  return `${short}_${prefix}_${index + 1}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

const rawCsv = fs.readFileSync(csvPath, 'utf8');
const body = decodeCsvPayload(rawCsv);
const parsed = parseSchema(body);

const schemasDir = path.join(repoRoot, 'schemas');
fs.mkdirSync(schemasDir, { recursive: true });

const tablesSql = [
  '-- Canonical table definitions generated from Supabase schema CSV',
  '-- Source: Supabase Snippet Schema Documentation Generator (Public Schema).csv',
  '',
];
for (const table of parsed.tables) {
  tablesSql.push(`CREATE TABLE IF NOT EXISTS ${table.name} (`);
  tablesSql.push(table.columns.map((col) => `  ${col}`).join(',\n'));
  tablesSql.push(');', '');
}

const constraintsAndFkSql = [
  '-- Check constraints and foreign keys generated from schema CSV',
  '',
];
for (const table of parsed.tables) {
  for (let idx = 0; idx < table.checks.length; idx += 1) {
    const checkExpr = table.checks[idx];
    const checkName = makeConstraintName(table.name, 'check', idx);
    constraintsAndFkSql.push(
      `ALTER TABLE ${table.name} ADD CONSTRAINT ${checkName} CHECK ${checkExpr};`,
    );
  }
  for (const fk of table.fks) {
    const match = fk.match(/^FK:\s+([a-zA-Z0-9_]+)\s+->\s+([a-zA-Z0-9_]+)\(([a-zA-Z0-9_]+)\)\s+ON DELETE\s+(.+)$/);
    if (!match) continue;
    const [, column, refTable, refColumn, onDelete] = match;
    const short = table.name.split('.').pop();
    const constraintName = `${short}_${column}_fkey`;
    constraintsAndFkSql.push(
      `ALTER TABLE ${table.name} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${column}) REFERENCES public.${refTable}(${refColumn}) ON DELETE ${onDelete};`,
    );
  }
  constraintsAndFkSql.push('');
}

const indexesSql = ['-- Indexes generated from schema CSV', ''];
for (const table of parsed.tables) {
  for (const index of table.indexes) indexesSql.push(`${index};`);
}
indexesSql.push('');

const functionsAndTriggersSql = ['-- Functions and triggers generated from schema CSV', ''];
functionsAndTriggersSql.push(...parsed.functions.map((fn) => `${fn}\n`));
for (const table of parsed.tables) {
  for (const triggerLine of table.triggers) {
    const triggerMatch = triggerLine.match(/^([a-zA-Z0-9_]+)\s+(.+?)\s+->\s+EXECUTE FUNCTION\s+(.+)$/);
    if (!triggerMatch) continue;
    const [, triggerName, triggerDef, triggerFn] = triggerMatch;
    functionsAndTriggersSql.push(
      `DROP TRIGGER IF EXISTS ${triggerName} ON ${table.name};`,
      `CREATE TRIGGER ${triggerName} ${triggerDef} ON ${table.name} FOR EACH ROW EXECUTE FUNCTION ${triggerFn};`,
      '',
    );
  }
}

const viewsSql = ['-- Views generated from schema CSV', ''];
for (const view of parsed.views) {
  viewsSql.push(`CREATE OR REPLACE VIEW ${view.name} AS`);
  viewsSql.push(view.selectSql.replace(/;\s*$/, ';'));
  viewsSql.push('');
}

const rlsSql = ['-- RLS policies generated from schema CSV', ''];
for (const table of parsed.tables) {
  rlsSql.push(`ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;`);
  for (const policy of table.policies) {
    const policyMatch = policy.policyHead.match(/^policy\s+(.+?)\s+FOR\s+([A-Z]+)\s+TO\s+(.+)$/);
    if (!policyMatch) continue;
    const [, name, operation, role] = policyMatch;
    rlsSql.push(`DROP POLICY IF EXISTS "${name}" ON ${table.name};`);
    rlsSql.push(`CREATE POLICY "${name}" ON ${table.name} FOR ${operation} TO ${role}`);
    for (const clause of policy.clauses) rlsSql.push(`  ${clause}`);
    rlsSql.push(';');
  }
  rlsSql.push('');
}

const enumsTypesSql = [
  '-- Enums and custom types generated from schema CSV',
  '',
  ...(parsed.enumsAndTypes.length ? parsed.enumsAndTypes : ['-- No explicit CREATE TYPE statements in source CSV payload.']),
  '',
];

const grantsSql = [
  '-- Grants generated from schema CSV',
  '',
  ...(parsed.grants.length ? parsed.grants : ['-- No explicit GRANT statements in source CSV payload.']),
  '',
];

const files = {
  '01-extensions.sql': `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\nCREATE EXTENSION IF NOT EXISTS "pgcrypto";\n`,
  '02-enums-and-types.sql': enumsTypesSql.join('\n'),
  '03-tables.sql': tablesSql.join('\n'),
  '04-foreign-keys.sql': constraintsAndFkSql.join('\n'),
  '05-indexes.sql': indexesSql.join('\n'),
  '06-functions-and-triggers.sql': functionsAndTriggersSql.join('\n'),
  '07-views.sql': viewsSql.join('\n'),
  '08-rls-policies.sql': rlsSql.join('\n'),
  '09-grants.sql': grantsSql.join('\n'),
};

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(schemasDir, name), content);
}

if (fs.existsSync(path.join(schemasDir, '05-menu-seeding.sql'))) {
  fs.copyFileSync(path.join(schemasDir, '05-menu-seeding.sql'), path.join(schemasDir, '10-seed-menu.sql'));
}
if (fs.existsSync(path.join(schemasDir, 'seed-example-users.sql'))) {
  fs.copyFileSync(path.join(schemasDir, 'seed-example-users.sql'), path.join(schemasDir, '11-seed-demo-users.sql'));
}

console.log(
  `Generated canonical schema files for ${parsed.tables.length} tables, ${parsed.views.length} views, ${parsed.functions.length} functions.`,
);
