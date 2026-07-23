import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const values = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

if (!values.SUPABASE_URL || !values.SUPABASE_ANON_KEY) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en .env');
}

mkdirSync('src/environments', { recursive: true });
writeFileSync(
  'src/environments/environment.generated.ts',
  `export const environment = ${JSON.stringify({
    supabaseUrl: values.SUPABASE_URL,
    supabaseAnonKey: values.SUPABASE_ANON_KEY,
    adminEmail: 'juan_ls58@hotmail.com',
  })} as const;\n`,
);
