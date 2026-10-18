import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailRecipient extends Document {
  _id: mongoose.Types.ObjectId;
  historyId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  buyerName: string;
  buyerEmail: string;
  personalizedContent: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  sentAt?: Date;
  del_flg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailRecipientSchema = new Schema<IEmailRecipient>({
  historyId: {
    type: Schema.Types.ObjectId,
    ref: 'EmailHistory',
    required: [true, 'History ID is required']
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Buyer ID is required']
  },
  buyerName: {
    type: String,
    required: [true, 'Buyer name is required'],
    trim: true,
    maxlength: [100, 'Buyer name cannot exceed 100 characters']
  },
  buyerEmail: {
    type: String,
    required: [true, 'Buyer email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  personalizedContent: {
    type: String,
    required: [true, 'Personalized content is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
    required: true
  },
  error: {
    type: String,
    trim: true,
    maxlength: [500, 'Error message cannot exceed 500 characters']
  },
  sentAt: {
    type: Date
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
EmailRecipientSchema.index({ historyId: 1, status: 1 });
EmailRecipientSchema.index({ buyerId: 1 });
EmailRecipientSchema.index({ status: 1 });
EmailRecipientSchema.index({ del_flg: 1 });
EmailRecipientSchema.index({ sentAt: -1 });

// Query middleware to exclude soft deleted documents by default
EmailRecipientSchema.pre(/^find/, function(next) {
  // @ts-ignore
  this.find({ del_flg: { $ne: true } });
  next();
});

export const EmailRecipient = mongoose.model<IEmailRecipient>('EmailRecipient', EmailRecipientSchema);