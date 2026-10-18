import mongoose, { Document, Schema } from 'mongoose';

export interface IProductView extends Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  date: string; // 'YYYY-MM-DD' format
  count: number;
  del_flg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductViewSchema = new Schema<IProductView>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
  },
  count: {
    type: Number,
    required: [true, 'Count is required'],
    min: [0, 'Count cannot be negative'],
    default: 0
  },
  del_flg: {
    type: Boolean,
    default: false,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for unique product view per day
ProductViewSchema.index({ productId: 1, date: 1 }, { unique: true });
ProductViewSchema.index({ date: -1 });
ProductViewSchema.index({ count: -1 });
ProductViewSchema.index({ del_flg: 1 });

// Query middleware to exclude soft deleted documents by default
ProductViewSchema.pre(/^find/, function(next) {
  // @ts-ignore
  this.find({ del_flg: { $ne: true } });
  next();
});

export const ProductView = mongoose.model<IProductView>('ProductView', ProductViewSchema);