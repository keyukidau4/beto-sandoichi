import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  selectedOptions: string[];
  subtotal: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  paymentType: '代引き' | 'ポイント';
  totalAmount: number;
  pointsUsed?: number;
  pointsEarned?: number;
  status: 'pending' | 'paid' | 'cancelled';
  del_flg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  selectedOptions: {
    type: [String],
    default: []
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  }
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Buyer ID is required']
  },
  items: {
    type: [OrderItemSchema],
    required: [true, 'Order items are required'],
    validate: {
      validator: function(items: IOrderItem[]) {
        return items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  paymentType: {
    type: String,
    enum: ['代引き', 'ポイント'],
    required: [true, 'Payment type is required']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  pointsUsed: {
    type: Number,
    min: [0, 'Points used cannot be negative'],
    default: 0
  },
  pointsEarned: {
    type: Number,
    min: [0, 'Points earned cannot be negative'],
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending',
    required: true
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
OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentType: 1 });
OrderSchema.index({ del_flg: 1 });
OrderSchema.index({ createdAt: -1 });

// Query middleware to exclude soft deleted documents by default
OrderSchema.pre(/^find/, function(next) {
  // @ts-ignore
  this.find({ del_flg: { $ne: true } });
  next();
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);