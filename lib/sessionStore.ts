import { Redis } from '@upstash/redis';

export interface AgentMessage {
  id: string;
  sender: 'agent';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  sessionId: string;
  roomId?: string;
  extId?: string;
  accountUniqId?: string;
  mode: 'ai' | 'agent';
  historySummary: string;
  agentMessages: AgentMessage[];
  resolved: boolean;
  updatedAt: number;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24;

const hasUpstashEnv =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasUpstashEnv ? Redis.fromEnv() : null;

const globalStore = globalThis as unknown as {
  __qontakSessions?: Map<string, ChatSession>;
  __roomToSession?: Map<string, string>;
};
const localSessions =
  globalStore.__qontakSessions ?? new Map<string, ChatSession>();
const localRoomToSession =
  globalStore.__roomToSession ?? new Map<string, string>();
globalStore.__qontakSessions = localSessions;
globalStore.__roomToSession = localRoomToSession;

const sessionKey = (sessionId: string) => `qontak:session:${sessionId}`;
const roomKey = (roomId: string) => `qontak:room:${roomId}`;

export async function getSession(
  sessionId: string
): Promise<ChatSession | undefined> {
  if (redis) {
    const data = await redis.get<ChatSession>(sessionKey(sessionId));
    return data ?? undefined;
  }
  return localSessions.get(sessionId);
}

export async function saveSession(session: ChatSession): Promise<void> {
  session.updatedAt = Date.now();
  if (redis) {
    await redis.set(sessionKey(session.sessionId), session, {
      ex: SESSION_TTL_SECONDS,
    });
    return;
  }
  localSessions.set(session.sessionId, session);
}

export async function getOrCreateSession(
  sessionId: string
): Promise<ChatSession> {
  const existing = await getSession(sessionId);
  if (existing) {
    return existing;
  }

  const created: ChatSession = {
    sessionId,
    mode: 'ai',
    historySummary: '',
    agentMessages: [],
    resolved: false,
    updatedAt: Date.now(),
  };

  await saveSession(created);
  return created;
}

export async function bindRoomToSession(
  roomId: string,
  sessionId: string,
  extId?: string,
  accountUniqId?: string
): Promise<ChatSession> {
  const session = await getOrCreateSession(sessionId);
  session.roomId = roomId;
  if (extId) session.extId = extId;
  if (accountUniqId) session.accountUniqId = accountUniqId;
  session.updatedAt = Date.now();

  if (redis) {
    await Promise.all([
      redis.set(sessionKey(sessionId), session, { ex: SESSION_TTL_SECONDS }),
      redis.set(roomKey(roomId), sessionId, { ex: SESSION_TTL_SECONDS }),
    ]);
  } else {
    localSessions.set(sessionId, session);
    localRoomToSession.set(roomId, sessionId);
  }

  return session;
}

export async function getSessionByRoomId(
  roomId: string
): Promise<ChatSession | undefined> {
  if (redis) {
    const sessionId = await redis.get<string>(roomKey(roomId));
    if (!sessionId) return undefined;
    return await getSession(sessionId);
  }

  const sessionId = localRoomToSession.get(roomId);
  if (!sessionId) return undefined;
  return localSessions.get(sessionId);
}