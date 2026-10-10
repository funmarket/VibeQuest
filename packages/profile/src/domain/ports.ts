import type { Profile, ProfileInput, PublicProfile } from "@vq/contracts";
export interface ProfileRepository {
  publicHandle(handle: string): Promise<PublicProfile | null>;
  publicMany(ids: string[]): Promise<PublicProfile[]>;
  read(userId: string): Promise<Profile | null>;
  save(userId: string, input: ProfileInput): Promise<Profile>;
  handleAvailable(handle: string, userId: string): Promise<boolean>;
  photoRetirements(): Promise<{ userId: string; mediaId: string }[]>;
  finishPhotoRetirement(mediaId: string): Promise<void>;
  retryPhotoRetirement(mediaId: string): Promise<void>;
  attachPhoto(
    userId: string,
    mediaId: string | null,
    version: number,
  ): Promise<Profile>;
}
export interface ProfileMedia {
  canAttach(userId: string, mediaId: string): Promise<boolean>;
  retire(userId: string, mediaId: string): Promise<void>;
}
