import { createHash } from "node:crypto";
import sharp from "sharp";
import { MediaError, type ImageProcessor } from "@vq/media";
export const imageProcessor: ImageProcessor = {
  async process(input, mime) {
    const bytes = Buffer.from(input);
    const format = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "png"
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? "jpeg"
        : bytes.subarray(0, 4).toString() === "RIFF" &&
            bytes.subarray(8, 12).toString() === "WEBP"
          ? "webp"
          : null;
    if (!format || mime !== `image/${format}`)
      throw new MediaError("INVALID_IMAGE");
    try {
      const source = sharp(bytes, {
        limitInputPixels: 20000000,
        failOn: "warning",
      });
      const metadata = await source.metadata();
      if (
        metadata.format !== format ||
        !metadata.width ||
        !metadata.height ||
        (metadata.pages ?? 1) !== 1
      )
        throw new MediaError("INVALID_IMAGE");
      const image = await source
        .clone()
        .rotate()
        .resize({
          width: 2048,
          height: 2048,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true });
      const thumbnail = await sharp(image.data)
        .resize({
          width: 320,
          height: 320,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 75 })
        .toBuffer();
      return {
        image: image.data,
        thumbnail,
        width: image.info.width,
        height: image.info.height,
        digest: createHash("sha256").update(bytes).digest("hex"),
      };
    } catch {
      throw new MediaError("INVALID_IMAGE");
    }
  },
};
