import Fastify from "fastify";
import type { PlacesRepository } from "@vq/contracts";
import { createListPublishedPlaces } from "./modules/places/application/list-published-places";
import { registerPlacesRoutes } from "./modules/places/http";
import type { IdentityRepository } from "@vq/identity";
import {
  registerIdentityRoutes,
  readSessionCookie,
} from "./modules/identity/http";
import type { ProfileRepository } from "@vq/profile";
import { registerProfileRoutes } from "./modules/profile/http";
import type { MediaRepository, MediaStorage } from "@vq/media";
import { registerMediaRoutes } from "./modules/media/http";
import { createLocalMediaStorage } from "./modules/media/infrastructure/local-storage";
import { imageProcessor } from "./modules/media/infrastructure/image-processor";
import type { BusinessRepository } from "@vq/business";
import { registerBusinessRoutes } from "./modules/business/http";
import type { ActivitiesRepository } from "@vq/activities";
import { registerActivitiesRoutes } from "./modules/activities/http";
import type { EventsRepository } from "@vq/events";
import { registerEventsRoutes } from "./modules/events/http";
import type { SocialRepository } from "@vq/social";
import { registerSocialRoutes } from "./modules/social/http";
import { registerPublicProfileRoutes } from "./modules/profile/public-http";
import type { ContentRepository } from "@vq/content";
import { registerContentRoutes } from "./modules/content/http";

export function buildApi(
  repository: PlacesRepository,
  options: {
    logger?: boolean;
    readiness?: () => Promise<void>;
    identity?: IdentityRepository;
    profiles?: ProfileRepository;
    businesses?: BusinessRepository;
    activities?: ActivitiesRepository;
    events?: EventsRepository;
    social?: SocialRepository;
    content?: ContentRepository;
    media?: MediaRepository;
    mediaRoot?: string;
    mediaStorage?: MediaStorage;
    allowedOrigins?: string[];
    secureCookies?: boolean;
  } = {},
) {
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 16384,
    requestTimeout: 10000,
    connectionTimeout: 10000,
    routerOptions: { maxParamLength: 200 },
  });
  registerPlacesRoutes(app, createListPublishedPlaces(repository));
  if (options.identity) {
    const accounts = registerIdentityRoutes(
      app,
      options.identity,
      options.allowedOrigins ?? [],
      options.secureCookies ?? true,
    );
    let content: ReturnType<typeof registerContentRoutes> | undefined;
    if (options.content) {
      let active: Promise<void> | undefined;
      const timer = setInterval(() => {
        if (!active)
          active = content
            ?.purgeExpired()
            .catch(() => {
              app.log.error(
                "Social Content expiry failed; records remain pending.",
              );
            })
            .finally(() => {
              active = undefined;
            });
      }, 60000);
      timer.unref();
      app.addHook("onClose", async () => {
        clearInterval(timer);
        await active;
      });
    }
    const storage =
      options.mediaStorage ??
      (options.mediaRoot
        ? createLocalMediaStorage(options.mediaRoot)
        : undefined);
    const media =
      options.media && storage
        ? registerMediaRoutes(
            app,
            options.media,
            storage,
            imageProcessor,
            (request) => accounts.me(readSessionCookie(request)),
            options.allowedOrigins ?? [],
            (postId, mediaId, actor) =>
              content?.canReadAttachment(postId, mediaId, actor) ??
              Promise.resolve(false),
          )
        : undefined;
    const businesses = options.businesses
      ? registerBusinessRoutes(
          app,
          options.businesses,
          { canReview: accounts.canReviewBusiness },
          (request) => accounts.me(readSessionCookie(request)),
          options.allowedOrigins ?? [],
        )
      : undefined;
    const profiles = options.profiles
      ? registerProfileRoutes(
          app,
          options.profiles,
          (request) => accounts.me(readSessionCookie(request)),
          options.allowedOrigins ?? [],
          media,
          accounts,
        )
      : undefined;
    if (profiles) {
      registerPublicProfileRoutes(app, profiles);
    }
    const social =
      options.social && profiles
        ? registerSocialRoutes(
            app,
            options.social,
            accounts,
            profiles,
            (request) => accounts.me(readSessionCookie(request)),
            options.allowedOrigins ?? [],
          )
        : undefined;
    if (options.content)
      content = registerContentRoutes(
        app,
        options.content,
        (request) => accounts.me(readSessionCookie(request)),
        options.allowedOrigins ?? [],
        {
          graph: social,
          profiles,
          media,
          canModerate: accounts.canModerateContent,
        },
      );
    const activities =
      options.activities && profiles
        ? registerActivitiesRoutes(
            app,
            options.activities,
            profiles,
            media,
            (request) => accounts.me(readSessionCookie(request)),
            options.allowedOrigins ?? [],
          )
        : undefined;
    const events =
      options.events && businesses && profiles
        ? registerEventsRoutes(
            app,
            options.events,
            businesses,
            profiles,
            media,
            (request) => accounts.me(readSessionCookie(request)),
            options.allowedOrigins ?? [],
          )
        : undefined;
    if (media) {
      let active: Promise<void> | undefined;
      const timer = setInterval(() => {
        if (!active)
          active = (async () => {
            await profiles?.cleanupPhotos();
            await activities?.cleanupAttachments();
            await events?.cleanupAttachments();
            await media.cleanup();
          })()
            .catch(() => {
              app.log.error("Media cleanup failed; pending jobs retained.");
            })
            .finally(() => {
              active = undefined;
            });
      }, 60000);
      timer.unref();
      app.addHook("onClose", async () => {
        clearInterval(timer);
        await active;
      });
    }
  }
  app.get("/health/live", async () => ({ status: "alive" }));
  app.get("/health/ready", async (_request, reply) => {
    if (!options.readiness)
      return reply.code(503).send({ status: "unavailable" });
    try {
      await options.readiness();
      return { status: "ready" };
    } catch {
      return reply.code(503).send({ status: "unavailable" });
    }
  });
  return app;
}
