import nextConfig from "eslint-config-next";

const eslintConfig = Array.isArray(nextConfig) ? nextConfig : [nextConfig];

export default eslintConfig;
