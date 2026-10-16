import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import { mediaSchema } from "@vq/contracts";
import { MediaError, type MediaStorage } from "@vq/media";
import type { RailwayMediaStorageConfiguration } from "./storage-configuration";

export function createRailwayMediaStorage(
  configuration: RailwayMediaStorageConfiguration,
): MediaStorage {
  const client = new S3Client({
    endpoint: configuration.endpoint,
    region: configuration.region,
    credentials: configuration.credentials,
    forcePathStyle: configuration.forcePathStyle,
    maxAttempts: 3,
    requestHandler: {
      connectionTimeout: 5000,
      requestTimeout: 10000,
      socketTimeout: 10000,
      throwOnRequestTimeout: true,
    },
  });
  function key(id: string, variant: "image" | "thumbnail") {
    if (
      !mediaSchema.shape.id.safeParse(id).success ||
      !["image", "thumbnail"].includes(variant)
    )
      throw new Error("Invalid object key.");
    return `media/${id.toLowerCase()}/${variant}.webp`;
  }
  return {
    async write(id, variant, bytes) {
      await client.send(
        new PutObjectCommand({
          Bucket: configuration.bucket,
          Key: key(id, variant),
          Body: bytes,
          ContentType: "image/webp",
        }),
      );
    },
    async read(id, variant) {
      try {
        const object = await client.send(
          new GetObjectCommand({
            Bucket: configuration.bucket,
            Key: key(id, variant),
          }),
        );
        if (!object.Body)
          throw new Error("Media storage returned no object body.");
        return await object.Body.transformToByteArray();
      } catch (error) {
        if (error instanceof NoSuchKey) throw new MediaError("MEDIA_NOT_FOUND");
        throw error;
      }
    },
    async remove(id) {
      for (const variant of ["image", "thumbnail"] as const) {
        try {
          await client.send(
            new DeleteObjectCommand({
              Bucket: configuration.bucket,
              Key: key(id, variant),
            }),
          );
        } catch (error) {
          if (!(error instanceof NoSuchKey)) throw error;
        }
      }
    },
  };
}
