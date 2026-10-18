import mongoose, { Document, Schema } from 'mongoose';

export interface IStockHistory extends Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  changeType: 'order_deduction' | 'admin_adjustment' | 'restock';
  previousStock: number;
  newStock: number;
  changeAmount: number;
  orderId?: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  note?: string;
  del_flg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StockHistorySchema = new Schema<IStockHistory>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  changeType: {
    type: String,
    enum: ['order_deduction', 'admin_adjustment', 'restock'],
    required: [true, 'Change type is required']
  },
  previousStock: {
    type: Number,
    required: [true, 'Previous stock is required'],
    min: [0, 'Previous stock cannot be negative']
  },
  newStock: {
    type: Number,
    required: [true, 'New stock is required'],
    min: [0, 'New stock cannot be negative']
  },
  changeAmount: {
    type: Number,
    required: [true, 'Change amount is required']
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters']
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
StockHistorySchema.index({ productId: 1, createdAt: -1 });
StockHistorySchema.index({ changeType: 1 });
StockHistorySchema.index({ del_flg: 1 });

// Query middleware to exclude soft deleted documents by default
StockHistorySchema.pre(/^find/, function(next) {
  // @ts-ignore
  this.find({ del_flg: { $ne: true } });
  next();
});

export const StockHistory = mongoose.model<IStockHistory>('StockHistory', StockHistorySchema);