import mongoose, { Document, Schema } from 'mongoose';

export interface EmailHistoryCreate {
  templateId: mongoose.Types.ObjectId;
  templateTitle: string;
  templateContent: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  status: 'sending' | 'completed' | 'failed';
  sentAt: Date;
  sentBy?: mongoose.Types.ObjectId;
}

export interface IEmailHistory extends Document {
  _id: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  templateTitle: string;
  templateContent: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  status: 'sending' | 'completed' | 'failed';
  sentBy?: mongoose.Types.ObjectId;
  sentAt: Date;
  completedAt?: Date;
  del_flg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailHistorySchema = new Schema<IEmailHistory>({
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    required: [true, 'Template ID is required']
  },
  templateTitle: {
    type: String,
    required: [true, 'Template title is required'],
    trim: true,
    maxlength: [200, 'Template title cannot exceed 200 characters']
  },
  templateContent: {
    type: String,
    required: [true, 'Template content is required'],
    trim: true
  },
  recipientCount: {
    type: Number,
    required: [true, 'Recipient count is required'],
    min: [1, 'Recipient count must be at least 1'],
    max: [10, 'Recipient count cannot exceed 10']
  },
  successCount: {
    type: Number,
    default: 0,
    min: [0, 'Success count cannot be negative']
  },
  failureCount: {
    type: Number,
    default: 0,
    min: [0, 'Failure count cannot be negative']
  },
  status: {
    type: String,
    enum: ['sending', 'completed', 'failed'],
    default: 'sending',
    required: true
  },
  sentBy: {
    type: Schema.Types.ObjectId,
    ref: 'users'
    // required: [true, 'Sender ID is required']
  },
  sentAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  completedAt: {
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
EmailHistorySchema.index({ sentBy: 1, sentAt: -1 });
EmailHistorySchema.index({ status: 1, sentAt: -1 });
EmailHistorySchema.index({ templateId: 1 });
EmailHistorySchema.index({ del_flg: 1 });
EmailHistorySchema.index({ sentAt: -1 });

// Query middleware to exclude soft deleted documents by default
EmailHistorySchema.pre(/^find/, function(next) {
  // @ts-ignore
  this.find({ del_flg: { $ne: true } });
  next();
});

export const EmailHistory = mongoose.model<IEmailHistory>('EmailHistory', EmailHistorySchema);