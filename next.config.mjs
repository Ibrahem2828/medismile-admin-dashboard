/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the production Docker image (copies .next/standalone).
  output: "standalone",
};

export default nextConfig;
