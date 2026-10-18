import mongoose, { Document, Schema } from 'mongoose';

export interface IProductOption {
  name: string;
  extraCost: number;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: 'banhmi' | 'drink';
  description: string;
  price: number;
  stock: number;
  options: IProductOption[];
  imageUrl?: string;
  del_flg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductOptionSchema = new Schema<IProductOption>({
  name: {
    type: String,
    required: [true, 'Option name is required'],
    trim: true
  },
  extraCost: {
    type: Number,
    required: [true, 'Extra cost is required'],
    min: [0, 'Extra cost cannot be negative']
  }
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['banhmi', 'drink'],
    required: [true, 'Product type is required']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  options: {
    type: [ProductOptionSchema],
    default: []
  },
  imageUrl: {
    type: String,
    trim: true
  },
  del_flg: {
    type: Boolean,
    default: false,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
ProductSchema.index({ type: 1, del_flg: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ createdAt: -1 });

// Query middleware to exclude soft deleted documents by default
ProductSchema.pre(/^find/, function(next) {
  // @ts-ignore
  this.find({ del_flg: { $ne: true } });
  next();
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);