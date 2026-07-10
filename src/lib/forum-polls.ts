import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { forumPolls, forumPollQuestions, forumPollChoices, forumPollVotes, users } from "@/db/schema";

export type PollChoiceView = { id: number; label: string; votes: number };
export type PollQuestionView = { id: number; title: string; multiple: boolean; total: number; choices: PollChoiceView[] };
export type PollVoterView = { id: number; name: string; handle: string; avatarUrl: string | null };
export type PollView = {
  id: number;
  title: string | null;
  publicVoters: boolean;
  closesAt: Date | null;
  closed: boolean;
  questions: PollQuestionView[];
  participants: number;
  hasVoted: boolean;
  myChoiceIds: number[];
  voters: PollVoterView[];
  now: number; // epoch ms do servidor, p/ contagem regressiva no cliente
};

/** Carrega a enquete de um tópico (se existir) com contagens, o voto do usuário e
 * — quando pública — a lista de votantes. */
export async function getTopicPoll(topicId: number, viewerId: number | null): Promise<PollView | null> {
  try {
    const [poll] = await db.select().from(forumPolls).where(eq(forumPolls.topicId, topicId)).limit(1);
    if (!poll) return null;

    const questions = await db.select().from(forumPollQuestions).where(eq(forumPollQuestions.pollId, poll.id)).orderBy(asc(forumPollQuestions.sortOrder), asc(forumPollQuestions.id));
    const qIds = questions.map((q) => q.id);
    const choices = qIds.length
      ? await db.select().from(forumPollChoices).where(inArray(forumPollChoices.questionId, qIds)).orderBy(asc(forumPollChoices.sortOrder), asc(forumPollChoices.id))
      : [];

    const questionViews: PollQuestionView[] = questions.map((q) => {
      const cs = choices.filter((c) => c.questionId === q.id).map((c) => ({ id: c.id, label: c.label, votes: c.votesCount }));
      return { id: q.id, title: q.title, multiple: q.multiple, total: cs.reduce((s, c) => s + c.votes, 0), choices: cs };
    });

    // Votos do usuário atual.
    let myChoiceIds: number[] = [];
    if (viewerId) {
      const mine = await db.select({ choiceId: forumPollVotes.choiceId }).from(forumPollVotes)
        .where(and(eq(forumPollVotes.pollId, poll.id), eq(forumPollVotes.userId, viewerId)));
      myChoiceIds = mine.map((m) => m.choiceId);
    }

    // Participantes distintos.
    const allVoters = await db.select({ userId: forumPollVotes.userId }).from(forumPollVotes).where(eq(forumPollVotes.pollId, poll.id));
    const participants = new Set(allVoters.map((v) => v.userId)).size;

    // Votantes (só se pública).
    let voters: PollVoterView[] = [];
    if (poll.publicVoters && participants > 0) {
      const voterIds = [...new Set(allVoters.map((v) => v.userId))].slice(0, 60);
      const rows = await db.select({ id: users.id, name: users.displayName, handle: users.handle, avatarUrl: users.avatarUrl })
        .from(users).where(inArray(users.id, voterIds));
      voters = rows;
    }

    const now = new Date();
    const closed = poll.closesAt != null && poll.closesAt.getTime() <= now.getTime();
    return {
      id: poll.id, title: poll.title, publicVoters: poll.publicVoters, closesAt: poll.closesAt, closed,
      questions: questionViews, participants, hasVoted: myChoiceIds.length > 0, myChoiceIds, voters, now: now.getTime(),
    };
  } catch {
    return null;
  }
}
