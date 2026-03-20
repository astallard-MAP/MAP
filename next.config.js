/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
       {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      }
    ],
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
