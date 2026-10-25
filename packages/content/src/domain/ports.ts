import type {
  ContentCursor,
  GossipTextInput,
  GossipTextEdit,
  GossipTextPost,
  GossipCommentInput,
  PublicProfile,
  GossipReportInput,
  ReportReceipt,
  ModerationCase,
  ModerationEvidence,
  ModerationDecision,
} from "@vq/contracts";

/** Raw Content persistence; application use cases enforce audience/actor rights. */
export interface ContentRepository {
  report(
    postId: string,
    targetType: "post" | "comment",
    targetId: string,
    actor: string,
    version: number,
    input: GossipReportInput,
  ): Promise<ReportReceipt>;
  cases(
    after: ContentCursor | null,
  ): Promise<{ reports: ModerationCase[]; nextCursor: ContentCursor | null }>;
  evidence(id: string): Promise<{
    report: ModerationCase;
    reason: GossipReportInput["reason"];
    details: string;
    evidence: ModerationEvidence;
  } | null>;
  decide(
    id: string,
    actor: string,
    input: ModerationDecision,
  ): Promise<ReportReceipt>;
  expireReports(): Promise<void>;
  read(id: string): Promise<GossipTextPost | null>;
  scan(
    after: ContentCursor | null,
    limit: number,
    authors: string[] | null,
  ): Promise<GossipTextPost[]>;
  stats(
    id: string,
    actor?: string,
  ): Promise<{ likeCount: number; commentCount: number; liked: boolean }>;
  comment(
    postId: string,
    actor: string,
    version: number,
    input: GossipCommentInput,
  ): Promise<CommentRecord>;
  comments(
    postId: string,
    after: ContentCursor | null,
  ): Promise<CommentRecord[]>;
  deleteComment(
    postId: string,
    id: string,
    actor: string,
    version: number,
  ): Promise<void>;
  react(
    postId: string,
    actor: string,
    version: number,
    liked: boolean,
  ): Promise<void>;
  retirements(): Promise<{ mediaId: string; userId: string }[]>;
  finishRetirement(id: string): Promise<void>;
  retryRetirement(id: string): Promise<void>;
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
export type CommentRecord = {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  text: string | null;
  createdAt: string;
};
export interface ContentGraph {
  feedAuthors(actor: string): Promise<string[]>;
  withRelationship<T>(
    actor: string | undefined,
    author: string,
    work: (facts: { following: boolean; blocked: boolean }) => Promise<T>,
  ): Promise<T>;
}
export interface ContentMedia {
  canAttachContent(actor: string, id: string): Promise<boolean>;
  retire(actor: string, id: string): Promise<void>;
}
export interface ContentProfiles {
  publicMany(ids: string[]): Promise<PublicProfile[]>;
}
