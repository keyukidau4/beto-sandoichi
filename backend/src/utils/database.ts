import mongoose from 'mongoose';

/**
 * Utility functions for database operations
 */

/**
 * Soft delete a document by setting del_flg to true
 */
export const softDelete = async (model: any, id: string): Promise<any> => {
  return await model.findByIdAndUpdate(
    id,
    { del_flg: true },
    { new: true }
  );
};

/**
 * Restore a soft deleted document by setting del_flg to false
 */
export const restoreDocument = async (model: any, id: string): Promise<any> => {
  return await model.findByIdAndUpdate(
    id,
    { del_flg: false },
    { new: true }
  );
};

/**
 * Find documents including soft deleted ones
 */
export const findWithDeleted = (model: any, query: any = {}) => {
  return model.findOneWithDeleted ? model.findOneWithDeleted(query) : model.findOne({ ...query });
};

/**
 * Find all documents including soft deleted ones
 */
export const findAllWithDeleted = (model: any, query: any = {}) => {
  return model.findWithDeleted ? model.findWithDeleted(query) : model.find({ ...query });
};

/**
 * Check if ObjectId is valid
 */
export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Convert string to ObjectId
 */
export const toObjectId = (id: string): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId(id);
};

/**
 * Pagination helper
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: any;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const paginate = async <T>(
  model: any,
  query: any = {},
  options: PaginationOptions = {}
): Promise<PaginationResult<T>> => {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(query)
      .sort(options.sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    model.countDocuments(query)
  ]);

  const pages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    }
  };
};