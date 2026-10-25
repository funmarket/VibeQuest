import {
  gossipTextInputSchema,
  gossipTextEditSchema,
  contentVersionSchema,
  contentIdSchema,
  contentCursorSchema,
  gossipPostInputSchema,
  gossipCommentInputSchema,
  gossipReportInputSchema,
  moderationDecisionSchema,
} from "@vq/contracts";
import type { ContentCursor, GossipTextPost, GossipView } from "@vq/contracts";
import type {
  ContentRepository,
  ContentGraph,
  ContentMedia,
  ContentProfiles,
  CommentRecord,
} from "../domain/ports";
import { ContentError } from "../domain/invariants";

export function createContent(
  repository: ContentRepository,
  dependencies: {
    graph?: ContentGraph;
    media?: ContentMedia;
    profiles?: ContentProfiles;
    canModerate?: (actor: string) => Promise<boolean>;
  } = {},
) {
  async function requireModerator(actor: string) {
    if (!(await dependencies.canModerate?.(actor)))
      throw new ContentError("CONTENT_FORBIDDEN");
  }
  async function attachment(actor: string, id: string | null) {
    if (id && !(await dependencies.media?.canAttachContent(actor, id)))
      throw new ContentError("INVALID_CONTENT_MEDIA");
  }
  async function withPost<T>(
    id: string,
    actor: string | undefined,
    work: (
      post: GossipTextPost,
      facts: { following: boolean; blocked: boolean },
    ) => Promise<T>,
  ): Promise<T> {
    if (!dependencies.graph || !dependencies.profiles)
      throw new ContentError("CONTENT_UNAVAILABLE");
    const initial = await repository.read(contentIdSchema.parse(id));
    if (!initial) throw new ContentError("CONTENT_NOT_FOUND");
    return dependencies.graph.withRelationship(
      actor,
      initial.authorId,
      async (facts) => {
        const post = await repository.read(id);
        if (
          !post ||
          facts.blocked ||
          (!actor && post.audience !== "PUBLIC") ||
          (actor !== post.authorId &&
            post.audience === "FOLLOWERS_ONLY" &&
            !facts.following) ||
          !(await dependencies.profiles!.publicMany([post.authorId])).length
        )
          throw new ContentError("CONTENT_NOT_FOUND");
        return work(post, facts);
      },
    );
  }
  async function present(
    post: GossipTextPost,
    actor?: string,
  ): Promise<GossipView> {
    const author = (
      await dependencies.profiles!.publicMany([post.authorId])
    )[0];
    if (!author) throw new ContentError("CONTENT_NOT_FOUND");
    return { ...post, author, ...(await repository.stats(post.id, actor)) };
  }
  async function commentView(row: CommentRecord) {
    const author =
      row.text === null
        ? null
        : ((await dependencies.profiles!.publicMany([row.authorId]))[0] ??
          null);
    return {
      id: row.id,
      postId: row.postId,
      parentId: row.parentId,
      text: author ? row.text : null,
      author,
      createdAt: row.createdAt,
    };
  }
  return {
    async report(
      id: string,
      actor: string,
      input: unknown,
      commentId?: string,
    ) {
      const parsed = gossipReportInputSchema.parse(input);
      const target = commentId
        ? contentIdSchema.parse(commentId)
        : contentIdSchema.parse(id);
      return withPost(id, actor, (post) =>
        repository.report(
          id,
          commentId ? "comment" : "post",
          target,
          actor,
          post.version,
          parsed,
        ),
      );
    },
    async cases(actor: string, after: ContentCursor | null) {
      await requireModerator(actor);
      return repository.cases(after);
    },
    async evidence(actor: string, id: string) {
      await requireModerator(actor);
      const result = await repository.evidence(contentIdSchema.parse(id));
      if (!result) throw new ContentError("CONTENT_NOT_FOUND");
      return result;
    },
    async decide(actor: string, id: string, input: unknown) {
      await requireModerator(actor);
      return repository.decide(
        contentIdSchema.parse(id),
        actor,
        moderationDecisionSchema.parse(input),
      );
    },
    async createText(actorId: string, input: unknown) {
      const parsed = gossipTextInputSchema.parse(input);
      await attachment(actorId, parsed.mediaId);
      return repository.createText(actorId, parsed);
    },
    async readOwn(actorId: string, id: string) {
      const post = await repository.readOwn(actorId, contentIdSchema.parse(id));
      if (!post) throw new ContentError("CONTENT_NOT_FOUND");
      return post;
    },
    listOwn(actorId: string, deleted: boolean, after: ContentCursor | null) {
      return repository.listOwn(
        actorId,
        deleted,
        after && contentCursorSchema.parse(after),
      );
    },
    async editText(actorId: string, id: string, input: unknown) {
      const parsed = gossipTextEditSchema.parse(input);
      const current = await repository.readOwn(
        actorId,
        contentIdSchema.parse(id),
      );
      if (!current) throw new ContentError("CONTENT_NOT_FOUND");
      const merged = gossipPostInputSchema.safeParse({
        text: parsed.text,
        locationLabel: parsed.locationLabel,
        audience: parsed.audience ?? current.audience,
        mediaId:
          parsed.mediaId === undefined ? current.mediaId : parsed.mediaId,
      });
      if (!merged.success) throw new ContentError("INVALID_CONTENT");
      await attachment(actorId, merged.data.mediaId);
      return repository.editText(actorId, id, parsed);
    },
    deleteOwn(actorId: string, id: string, input: unknown) {
      return repository.deleteOwn(
        actorId,
        contentIdSchema.parse(id),
        contentVersionSchema.parse(input).version,
      );
    },
    restoreOwn(actorId: string, id: string, input: unknown) {
      return repository.restoreOwn(
        actorId,
        contentIdSchema.parse(id),
        contentVersionSchema.parse(input).version,
      );
    },
    async purgeExpired() {
      await repository.expireReports();
      await repository.purgeExpired();
      if (dependencies.media)
        for (const job of await repository.retirements()) {
          try {
            await dependencies.media.retire(job.userId, job.mediaId);
            await repository.finishRetirement(job.mediaId);
          } catch {
            await repository.retryRetirement(job.mediaId);
          }
        }
    },
    read: (id: string, actor?: string) =>
      withPost(id, actor, (post) => present(post, actor)),
    async canReadAttachment(id: string, mediaId: string, actor?: string) {
      try {
        return await withPost(
          id,
          actor,
          async (post) => post.mediaId === mediaId,
        );
      } catch (error) {
        if (error instanceof ContentError && error.code === "CONTENT_NOT_FOUND")
          return false;
        throw error;
      }
    },
    async feed(actor: string | undefined, after: ContentCursor | null) {
      if (!dependencies.graph) throw new ContentError("CONTENT_UNAVAILABLE");
      const authors = actor
        ? await dependencies.graph.feedAuthors(actor)
        : null;
      const posts: GossipView[] = [];
      let cursor = after,
        last: ContentCursor | null = null;
      for (;;) {
        const rows = await repository.scan(cursor, 100, authors);
        if (!rows.length) break;
        for (const row of rows) {
          try {
            const item = await withPost(row.id, actor, async (post, facts) =>
              !actor || post.authorId === actor || facts.following
                ? present(post, actor)
                : null,
            );
            if (!item) continue;
            if (posts.length === 20) return { posts, nextCursor: last };
            posts.push(item);
            last = { at: item.createdAt, id: item.id };
          } catch (error) {
            if (!(
              error instanceof ContentError &&
              error.code === "CONTENT_NOT_FOUND"
            ))
              throw error;
          }
        }
        if (rows.length < 100) break;
        const row = rows.at(-1)!;
        cursor = { at: row.createdAt, id: row.id };
      }
      return { posts, nextCursor: null };
    },
    async react(id: string, actor: string, liked: boolean) {
      return withPost(id, actor, async (post) => {
        await repository.react(id, actor, post.version, liked);
        return present(post, actor);
      });
    },
    async comment(id: string, actor: string, input: unknown) {
      const parsed = gossipCommentInputSchema.parse(input);
      return withPost(id, actor, async (post) =>
        commentView(await repository.comment(id, actor, post.version, parsed)),
      );
    },
    async comments(
      id: string,
      actor: string | undefined,
      after: ContentCursor | null,
    ) {
      return withPost(id, actor, async () => {
        const rows = await repository.comments(id, after);
        const visible = rows.slice(0, 20),
          last = visible.at(-1);
        return {
          comments: await Promise.all(visible.map(commentView)),
          nextCursor:
            rows.length > 20 && last
              ? { at: last.createdAt, id: last.id }
              : null,
        };
      });
    },
    async deleteComment(id: string, commentId: string, actor: string) {
      return withPost(id, actor, (post) =>
        repository.deleteComment(
          id,
          contentIdSchema.parse(commentId),
          actor,
          post.version,
        ),
      );
    },
  };
}
