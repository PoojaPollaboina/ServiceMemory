/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hindsight client is server-only; keep it out of the client bundle.
  serverExternalPackages: ["@vectorize-io/hindsight-client"],
};
export default nextConfig;
