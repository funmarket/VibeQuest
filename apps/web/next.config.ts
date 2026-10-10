import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";
const config: NextConfig = {
  turbopack: { root: path.resolve(process.cwd(), "../..") },
  transpilePackages: ["@vq/ui", "@vq/contracts", "@vq/api-client"],
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_ORIGIN ?? "http://127.0.0.1:4100"}/:path*`,
      },
    ];
  },
};
export default createNextIntlPlugin("./src/i18n/request.ts")(config);
