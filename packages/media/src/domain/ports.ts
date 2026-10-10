import type { MediaObject } from "@vq/contracts";
export type MediaRecord = MediaObject & { ownerId: string };
export interface ProcessedImage {
  image: Uint8Array;
  thumbnail: Uint8Array;
  width: number;
  height: number;
  digest: string;
}
export interface MediaRepository {
  create(
    ownerId: string,
    visibility: "public" | "private",
  ): Promise<MediaRecord>;
  read(id: string): Promise<MediaRecord | null>;
  claim(id: string, ownerId: string): Promise<boolean>;
  ready(id: string, output: ProcessedImage): Promise<MediaRecord>;
  fail(id: string): Promise<void>;
  markDeleted(id: string, ownerId: string): Promise<boolean>;
  expireUploads(): Promise<void>;
  cleanupJobs(): Promise<string[]>;
  completeCleanup(id: string): Promise<void>;
  retryCleanup(id: string): Promise<void>;
}
export interface MediaStorage {
  write(
    id: string,
    variant: "image" | "thumbnail",
    bytes: Uint8Array,
  ): Promise<void>;
  read(id: string, variant: "image" | "thumbnail"): Promise<Uint8Array>;
  remove(id: string): Promise<void>;
}
export interface ImageProcessor {
  process(bytes: Uint8Array, mime: string): Promise<ProcessedImage>;
}
