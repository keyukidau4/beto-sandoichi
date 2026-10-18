import mongoose, { Document, Schema } from 'mongoose';

export interface IPointTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  type: 'purchase_reward' | 'bank_deposit_transfer_add' | 'purchase_deduction';
  amount: number;
  note: string;
  del_flg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PointTransactionSchema = new Schema<IPointTransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'User ID is required']
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  type: {
    type: String,
    enum: ['purchase_reward', 'bank_deposit_transfer_add', 'purchase_deduction'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    validate: {
      validator: function(amount: number) {
        // Amount can be positive (earned) or negative (used)
        return amount !== 0;
      },
      message: 'Amount cannot be zero'
    }
  },
  note: {
    type: String,
    required: [true, 'Note is required'],
    trim: true,
    maxlength: [200, 'Note cannot exceed 200 characters']
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
PointTransactionSchema.index({ userId: 1, createdAt: -1 });
PointTransactionSchema.index({ type: 1 });
PointTransactionSchema.index({ orderId: 1 });
PointTransactionSchema.index({ del_flg: 1 });

// Query middleware to exclude soft deleted documents by default
PointTransactionSchema.pre(/^find/, function(next) {
  // @ts-ignore
  this.find({ del_flg: { $ne: true } });
  next();
});

export const PointTransaction = mongoose.model<IPointTransaction>('PointTransaction', PointTransactionSchema);