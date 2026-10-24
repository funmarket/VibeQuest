import {
  mediaResponseSchema,
  profilePhotoInputSchema,
  profileResponseSchema,
} from "@vq/contracts";

async function checked(response: Response) {
  if (!response.ok) throw new Error("MEDIA_REQUEST_FAILED");
  return response;
}
export async function uploadImage(
  baseURL: string,
  file: Blob,
  visibility: "private" | "public" = "private",
) {
  const base = baseURL.replace(/\/$/, "");
  const intent = await checked(
    await fetch(`${base}/v1/media/uploads`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    }),
  );
  const { media } = mediaResponseSchema.parse(await intent.json());
  const result = await checked(
    await fetch(`${base}/v1/media/uploads/${media.id}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": file.type },
      body: file,
    }),
  );
  return mediaResponseSchema.parse(await result.json()).media;
}
export async function attachProfilePhoto(
  baseURL: string,
  mediaId: string | null,
  version: number,
) {
  const input = profilePhotoInputSchema.parse({ mediaId, version });
  const response = await fetch(
    `${baseURL.replace(/\/$/, "")}/v1/profile/photo`,
    {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.code === "STALE_PROFILE"
        ? "STALE_PROFILE"
        : "MEDIA_REQUEST_FAILED",
    );
  }
  return profileResponseSchema.parse(await response.json()).profile;
}
export async function deleteMedia(baseURL: string, id: string) {
  await checked(
    await fetch(`${baseURL.replace(/\/$/, "")}/v1/media/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    }),
  );
}
