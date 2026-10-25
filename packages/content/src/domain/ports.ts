import type {
  ContentCursor,
  GossipTextInput,
  GossipTextEdit,
  GossipTextPost,
} from "@vq/contracts";

/** Author-scoped storage only; this port does not grant audience read access. */
export interface ContentRepository {
  createText(actorId: string, input: GossipTextInput): Promise<GossipTextPost>;
  readOwn(actorId: string, id: string): Promise<GossipTextPost | null>;
  listOwn(
    actorId: string,
    deleted: boolean,
    after: ContentCursor | null,
  ): Promise<{ posts: GossipTextPost[]; nextCursor: ContentCursor | null }>;
  editText(
    actorId: string,
    id: string,
    input: GossipTextEdit,
  ): Promise<GossipTextPost>;
  deleteOwn(
    actorId: string,
    id: string,
    version: number,
  ): Promise<GossipTextPost>;
  restoreOwn(
    actorId: string,
    id: string,
    version: number,
  ): Promise<GossipTextPost>;
  purgeExpired(): Promise<void>;
}
