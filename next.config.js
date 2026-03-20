/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      'genkit', 
      '@genkit-ai/vertexai', 
      'firebase-admin', 
      '@mailchimp/mailchimp_marketing',
      'nodemailer'
    ],
  }
};

module.exports = nextConfig;
