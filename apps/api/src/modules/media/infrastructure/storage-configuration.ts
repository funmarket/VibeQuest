import { fileURLToPath } from "node:url";

export interface RailwayMediaStorageConfiguration {
  backend: "railway";
  endpoint: string;
  region: string;
  bucket: string;
  forcePathStyle: boolean;
  credentials: { accessKeyId: string; secretAccessKey: string };
}

export function parseMediaStorageEnvironment(
  environment: Record<string, string | undefined>,
): RailwayMediaStorageConfiguration | { backend: "local"; directory: string } {
  const selected = environment.MEDIA_STORAGE?.trim();
  const bucketSettings = Object.keys(environment).some(
    (key) => key.startsWith("MEDIA_BUCKET_") && environment[key] !== undefined,
  );
  const hosted =
    environment.NODE_ENV === "production" ||
    !!environment.RAILWAY_ENVIRONMENT_NAME;
  if (
    (!selected && (hosted || bucketSettings)) ||
    (hosted && selected !== "railway")
  )
    throw new Error(
      "MEDIA_STORAGE must explicitly select railway in production or Railway environments.",
    );
  if (selected === "local" || !selected) {
    if (bucketSettings)
      throw new Error(
        "MEDIA_STORAGE=local cannot include MEDIA_BUCKET_* settings.",
      );
    return {
      backend: "local",
      directory:
        environment.MEDIA_LOCAL_ROOT?.trim() ||
        fileURLToPath(
          new URL("../../../../../../.local/media/", import.meta.url),
        ),
    };
  }
  if (selected !== "railway")
    throw new Error("MEDIA_STORAGE must be local or railway.");
  function required(name: string) {
    const value = environment[name]?.trim();
    if (!value)
      throw new Error(`${name} is required when MEDIA_STORAGE=railway.`);
    return value;
  }
  const endpoint = required("MEDIA_BUCKET_ENDPOINT");
  let validEndpoint = false;
  try {
    const url = new URL(endpoint);
    validEndpoint =
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/";
  } catch {
    /* Reject malformed endpoints without including their contents. */
  }
  if (!validEndpoint)
    throw new Error(
      "MEDIA_BUCKET_ENDPOINT must be an HTTPS base endpoint without credentials, path, query or fragment.",
    );
  const bucket = required("MEDIA_BUCKET_NAME");
  if (
    !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) ||
    bucket.includes("..")
  )
    throw new Error("MEDIA_BUCKET_NAME must be an S3 bucket name.");
  const style = environment.MEDIA_BUCKET_FORCE_PATH_STYLE?.trim() ?? "false";
  if (style !== "true" && style !== "false")
    throw new Error("MEDIA_BUCKET_FORCE_PATH_STYLE must be true or false.");
  return {
    backend: "railway",
    endpoint,
    region: required("MEDIA_BUCKET_REGION"),
    bucket,
    forcePathStyle: style === "true",
    credentials: {
      accessKeyId: required("MEDIA_BUCKET_ACCESS_KEY_ID"),
      secretAccessKey: required("MEDIA_BUCKET_SECRET_ACCESS_KEY"),
    },
  };
}
