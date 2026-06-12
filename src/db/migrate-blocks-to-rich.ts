import "dotenv/config";
import mysql from "mysql2/promise";
import { BlockTreeSchema } from "@/lib/blocks/schema";
import { RichDocSchema, isRichDoc } from "@/lib/blocks/rich-schema";
import { blockTreeToRichDoc } from "@/lib/blocks/convert";

// Migração única: converte o corpo das revisões CORRENTES (de guias/posts) do
// formato antigo de blocos para o documento do editor rico. Idempotente: pula o
// que já está em formato rico. Dry-run por padrão; use `--apply` para gravar.
//
//   tsx src/db/migrate-blocks-to-rich.ts            # só valida e relata
//   tsx src/db/migrate-blocks-to-rich.ts --apply    # grava as conversões

const APPLY = process.argv.includes("--apply");

type Row = { rid: number; aid: number; slug: string; kind: string; body: unknown };

function parseBody(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL não definido.");
  const conn = await mysql.createConnection({ uri, charset: "utf8mb4" });

  const [rows] = await conn.query(
    `SELECT r.id AS rid, a.id AS aid, a.slug, a.kind, r.body
       FROM articles a
       JOIN revisions r ON r.id = a.current_revision_id`,
  );

  const list = rows as Row[];
  let already = 0,
    converted = 0,
    failed = 0,
    applied = 0;
  const failures: string[] = [];

  for (const row of list) {
    const body = parseBody(row.body);
    if (isRichDoc(body)) {
      already++;
      continue;
    }
    const parsed = BlockTreeSchema.safeParse(body);
    if (!parsed.success) {
      failed++;
      failures.push(`#${row.aid} ${row.slug}: corpo não é BlockTree válido (${parsed.error.issues[0]?.message ?? "?"})`);
      continue;
    }
    const doc = blockTreeToRichDoc(parsed.data);
    const check = RichDocSchema.safeParse(doc);
    if (!check.success) {
      failed++;
      failures.push(`#${row.aid} ${row.slug}: doc convertido inválido (${check.error.issues[0]?.message ?? "?"})`);
      continue;
    }
    converted++;
    if (APPLY) {
      await conn.execute(`UPDATE revisions SET body = ? WHERE id = ?`, [JSON.stringify(check.data), row.rid]);
      applied++;
    }
  }

  console.log(`\n=== Migração blocos → editor rico (${APPLY ? "APLICAR" : "DRY-RUN"}) ===`);
  console.log(`Revisões correntes:   ${list.length}`);
  console.log(`Já em formato rico:   ${already}`);
  console.log(`Convertíveis:         ${converted}`);
  console.log(`Falhas:               ${failed}`);
  if (APPLY) console.log(`Gravadas:             ${applied}`);
  if (failures.length) {
    console.log(`\nFalhas detalhadas:`);
    failures.forEach((f) => console.log(`  - ${f}`));
  }

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
