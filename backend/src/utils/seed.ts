/**
 * Bootstraps a production-ready database with:
 *   - one admin user (from SEED_ADMIN_* env vars)
 *   - the default category set the site content model was designed around
 *
 * Safe to re-run: skips anything that already exists instead of duplicating it.
 *
 * Usage:
 *   npm run seed
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { logger } from '../utils/logger';

const DEFAULT_CATEGORIES = [
  { name: 'Android Apps', description: 'Android app news, guides and reviews.' },
  { name: 'Gadgets & Reviews', description: 'Hands-on gadget reviews and buying guides.' },
  { name: 'OTT & Streaming', description: 'Streaming platforms, shows and releases.' },
  { name: 'Tech News', description: 'The latest in technology.' },
  { name: 'Upcoming Mobiles', description: 'Upcoming phone launches and leaks.' },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function run(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME || 'Admin';

  if (!adminEmail || !adminPassword) {
    logger.error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set (in .env or the environment) before seeding.'
    );
    process.exit(1);
  }
  if (adminPassword.length < 8) {
    logger.error('SEED_ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);
  logger.info('Connected to MongoDB for seeding.');

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existingAdmin) {
    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      await existingAdmin.save({ validateBeforeSave: false });
      logger.info(`Promoted existing user ${adminEmail} to admin.`);
    } else {
      logger.info(`Admin user ${adminEmail} already exists — skipping.`);
    }
  } else {
    await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'admin',
      isVerified: true,
    });
    logger.info(`Created admin user: ${adminEmail}`);
  }

  for (const cat of DEFAULT_CATEGORIES) {
    const slug = slugify(cat.name);
    const existing = await Category.findOne({ slug });
    if (existing) continue;
    await Category.create({ name: cat.name, slug, description: cat.description });
    logger.info(`Created category: ${cat.name}`);
  }

  logger.info('Seeding complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Seeding failed: ${(err as Error).message}`);
  process.exit(1);
});
