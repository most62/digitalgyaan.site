import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value : fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '5000')),
  apiUrl: optional('API_URL', 'http://localhost:5000'),
  clientUrl: optional('CLIENT_URL', 'http://localhost:3000'),

  mongoUri: required('MONGO_URI'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
  },
  cookieSecret: optional('COOKIE_SECRET', 'dev_cookie_secret_change_me'),

  cloudinary: {
    cloudName: optional('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: optional('CLOUDINARY_API_KEY', ''),
    apiSecret: optional('CLOUDINARY_API_SECRET', ''),
  },

  smtp: {
    host: optional('SMTP_HOST', ''),
    port: Number(optional('SMTP_PORT', '465')),
    secure: optional('SMTP_SECURE', 'true') === 'true',
    user: optional('SMTP_USER', ''),
    password: optional('SMTP_PASSWORD', ''),
    from: optional('EMAIL_FROM', 'Digital Gyaan <no-reply@digitalgyaan.site>'),
  },

  rateLimit: {
    windowMs: Number(optional('RATE_LIMIT_WINDOW_MS', '900000')),
    max: Number(optional('RATE_LIMIT_MAX', '300')),
  },

  site: {
    name: optional('SITE_NAME', 'Digital Gyaan'),
    url: optional('SITE_URL', 'https://digitalgyaan.site'),
  },

  isProd: optional('NODE_ENV', 'development') === 'production',
};
