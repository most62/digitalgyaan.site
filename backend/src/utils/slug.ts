import slugify from 'slugify';
import { Model, Types } from 'mongoose';

export async function generateUniqueSlugForModel(
  model: Model<{ slug: string }>,
  name: string,
  currentId?: Types.ObjectId
): Promise<string> {
  const base = slugify(name, { lower: true, strict: true, trim: true });
  let slug = base;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await model.findOne({ slug, _id: { $ne: currentId } }).lean();
    if (!existing) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}
