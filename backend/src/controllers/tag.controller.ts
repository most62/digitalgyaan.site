import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { Tag } from '../models/Tag';
import { Post } from '../models/Post';
import { generateUniqueSlugForModel } from '../utils/slug';

export const getTags = catchAsync(async (_req: Request, res: Response) => {
  const tags = await Tag.find().sort('name');
  res.status(200).json({ success: true, data: tags });
});

export const getTagBySlug = catchAsync(async (req: Request, res: Response) => {
  const tag = await Tag.findOne({ slug: req.params.slug });
  if (!tag) {
    throw new AppError('Tag not found.', 404);
  }
  res.status(200).json({ success: true, data: tag });
});

export const createTag = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;
  const slug = await generateUniqueSlugForModel(Tag, name);
  const tag = await Tag.create({ name, slug });
  res.status(201).json({ success: true, data: tag });
});

export const updateTag = catchAsync(async (req: Request, res: Response) => {
  const tag = await Tag.findById(req.params.id);
  if (!tag) {
    throw new AppError('Tag not found.', 404);
  }
  const { name } = req.body;
  if (name && name !== tag.name) {
    tag.slug = await generateUniqueSlugForModel(Tag, name, tag._id as Types.ObjectId);
    tag.name = name;
  }
  await tag.save();
  res.status(200).json({ success: true, data: tag });
});

export const deleteTag = catchAsync(async (req: Request, res: Response) => {
  const tag = await Tag.findById(req.params.id);
  if (!tag) {
    throw new AppError('Tag not found.', 404);
  }

  const postsUsingTag = await Post.countDocuments({ tags: tag._id });
  if (postsUsingTag > 0) {
    throw new AppError(
      `Cannot delete tag: ${postsUsingTag} post(s) still reference it. Remove it from those posts first.`,
      409
    );
  }

  await tag.deleteOne();
  res.status(204).send();
});
