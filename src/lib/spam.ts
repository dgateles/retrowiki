import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { spamQuestions, geoRules } from "@/db/schema";

// ── Desafio Pergunta & Resposta ────────────────────────────────────────────

export type SpamQuestion = { id: number; question: string; answers: string[]; sortOrder: number };

function asAnswers(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export async function listQuestions(): Promise<SpamQuestion[]> {
  try {
    const rows = await db.select().from(spamQuestions).orderBy(asc(spamQuestions.sortOrder), asc(spamQuestions.id));
    return rows.map((r) => ({ id: r.id, question: r.question, answers: asAnswers(r.answers), sortOrder: r.sortOrder }));
  } catch {
    return [];
  }
}

/** Uma pergunta aleatória para o cadastro (ou null se não houver). */
export async function randomQuestion(): Promise<{ id: number; question: string } | null> {
  try {
    const [row] = await db.select({ id: spamQuestions.id, question: spamQuestions.question }).from(spamQuestions).orderBy(sql`RAND()`).limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

/** Confere a resposta (case-insensitive, trim) contra as aceitas. */
export async function checkAnswer(questionId: number, answer: string): Promise<boolean> {
  try {
    const [row] = await db.select({ answers: spamQuestions.answers }).from(spamQuestions).where(eq(spamQuestions.id, questionId)).limit(1);
    if (!row) return false;
    const accepted = asAnswers(row.answers).map((a) => a.trim().toLowerCase());
    return accepted.includes(answer.trim().toLowerCase());
  } catch {
    return false;
  }
}

/** Há ao menos uma pergunta cadastrada? (desafio ativo) */
export async function hasQuestions(): Promise<boolean> {
  try {
    const [row] = await db.select({ id: spamQuestions.id }).from(spamQuestions).limit(1);
    return Boolean(row);
  } catch {
    return false;
  }
}

export type QuestionInput = { question: string; answers: string[] };

export async function createQuestion(input: QuestionInput): Promise<number | null> {
  try {
    const all = await db.select({ s: spamQuestions.sortOrder }).from(spamQuestions);
    const sortOrder = Math.max(0, ...all.map((r) => r.s)) + 1;
    const [res] = await db.insert(spamQuestions).values({ question: input.question, answers: input.answers, sortOrder });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateQuestion(id: number, input: QuestionInput): Promise<boolean> {
  try {
    await db.update(spamQuestions).set({ question: input.question, answers: input.answers }).where(eq(spamQuestions.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteQuestion(id: number): Promise<boolean> {
  try {
    await db.delete(spamQuestions).where(eq(spamQuestions.id, id));
    return true;
  } catch {
    return false;
  }
}

// ── Regras de geolocalização ───────────────────────────────────────────────

export type GeoRule = { id: number; countryCode: string; action: "flag" | "block" };

export async function listGeoRules(): Promise<GeoRule[]> {
  try {
    const rows = await db.select().from(geoRules).orderBy(asc(geoRules.countryCode));
    return rows.map((r) => ({ id: r.id, countryCode: r.countryCode, action: r.action as "flag" | "block" }));
  } catch {
    return [];
  }
}

/** Ação configurada para um país (ou null). */
export async function geoActionForCountry(code: string): Promise<"flag" | "block" | null> {
  if (!code) return null;
  try {
    const [row] = await db.select({ action: geoRules.action }).from(geoRules).where(eq(geoRules.countryCode, code.toUpperCase())).limit(1);
    return row ? (row.action as "flag" | "block") : null;
  } catch {
    return null;
  }
}

export async function upsertGeoRule(countryCode: string, action: "flag" | "block"): Promise<boolean> {
  try {
    await db.insert(geoRules).values({ countryCode: countryCode.toUpperCase().slice(0, 2), action }).onDuplicateKeyUpdate({ set: { action } });
    return true;
  } catch {
    return false;
  }
}

export async function deleteGeoRule(id: number): Promise<boolean> {
  try {
    await db.delete(geoRules).where(eq(geoRules.id, id));
    return true;
  } catch {
    return false;
  }
}
