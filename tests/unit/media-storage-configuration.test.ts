import { expect, it } from "vitest";
import { parseMediaStorageEnvironment } from "../../apps/api/src/modules/media/infrastructure/storage-configuration";

const bucket = {
  MEDIA_STORAGE: "railway",
  MEDIA_BUCKET_ENDPOINT: "https://t3.storageapi.dev",
  MEDIA_BUCKET_REGION: "auto",
  MEDIA_BUCKET_NAME: "vq-media-example",
  MEDIA_BUCKET_ACCESS_KEY_ID: "test-key",
  MEDIA_BUCKET_SECRET_ACCESS_KEY: "test-secret",
};

it("selects a complete Railway configuration without filesystem fallback", () => {
  expect(
    parseMediaStorageEnvironment({ ...bucket, NODE_ENV: "production" }),
  ).toEqual({
    backend: "railway",
    endpoint: bucket.MEDIA_BUCKET_ENDPOINT,
    region: "auto",
    bucket: "vq-media-example",
    forcePathStyle: false,
    credentials: { accessKeyId: "test-key", secretAccessKey: "test-secret" },
  });
  expect(
    parseMediaStorageEnvironment({
      ...bucket,
      MEDIA_BUCKET_FORCE_PATH_STYLE: "true",
    }),
  ).toMatchObject({ forcePathStyle: true });
});

it("keeps local development available without bucket credentials", () => {
  expect(parseMediaStorageEnvironment({})).toMatchObject({ backend: "local" });
  expect(
    parseMediaStorageEnvironment({
      MEDIA_STORAGE: "local",
      MEDIA_LOCAL_ROOT: "./test-media",
    }),
  ).toEqual({ backend: "local", directory: "./test-media" });
});

it("requires explicit Railway selection in production and Railway staging", () => {
  for (const environment of [
    { NODE_ENV: "production" },
    { RAILWAY_ENVIRONMENT_NAME: "staging" },
    { NODE_ENV: "production", MEDIA_STORAGE: "local" },
  ])
    expect(() => parseMediaStorageEnvironment(environment)).toThrow(
      /MEDIA_STORAGE/,
    );
});

it("rejects incomplete credentials and missing endpoint, region or bucket", () => {
  for (const name of [
    "MEDIA_BUCKET_ENDPOINT",
    "MEDIA_BUCKET_REGION",
    "MEDIA_BUCKET_NAME",
    "MEDIA_BUCKET_ACCESS_KEY_ID",
    "MEDIA_BUCKET_SECRET_ACCESS_KEY",
  ])
    expect(() =>
      parseMediaStorageEnvironment({ ...bucket, [name]: " " }),
    ).toThrow(name);
});

it("rejects inconsistent or malformed storage settings without exposing secrets", () => {
  for (const environment of [
    { ...bucket, MEDIA_STORAGE: "unknown" },
    { ...bucket, MEDIA_STORAGE: "local" },
    { ...bucket, MEDIA_STORAGE: undefined },
    { ...bucket, MEDIA_BUCKET_ENDPOINT: "http://t3.storageapi.dev" },
    {
      ...bucket,
      MEDIA_BUCKET_ENDPOINT: "https://user:password@t3.storageapi.dev",
    },
    { ...bucket, MEDIA_BUCKET_ENDPOINT: "https://t3.storageapi.dev/bucket" },
    {
      ...bucket,
      MEDIA_BUCKET_ENDPOINT: "https://t3.storageapi.dev?secret=test-secret",
    },
    { ...bucket, MEDIA_BUCKET_NAME: "../other-bucket" },
    { ...bucket, MEDIA_BUCKET_FORCE_PATH_STYLE: "yes" },
  ]) {
    expect(() => parseMediaStorageEnvironment(environment)).toThrow();
    try {
      parseMediaStorageEnvironment(environment);
    } catch (error) {
      expect(String(error)).not.toContain("test-secret");
    }
  }
});
