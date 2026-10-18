import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: 'approval' | 'general' | 'promotion' | 'order_confirmation' | 'status_update' | 'point_notification';
  placeholders: string[];
  isDefault: boolean;
  del_flg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
  title: {
    type: String,
    required: [true, 'Email title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Email content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  type: {
    type: String,
    enum: ['approval', 'general', 'promotion', 'order_confirmation', 'status_update', 'point_notification'],
    required: [true, 'Email template type is required']
  },
  placeholders: {
    type: [String],
    default: []
  },
  isDefault: {
    type: Boolean,
    default: false
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
EmailTemplateSchema.index({ type: 1, del_flg: 1 });
EmailTemplateSchema.index({ del_flg: 1 });
EmailTemplateSchema.index({ createdAt: -1 });
EmailTemplateSchema.index({ isDefault: 1, type: 1 });

// Query middleware to exclude soft deleted documents by default
EmailTemplateSchema.pre(/^find/, function(next) {
  // @ts-ignore
  this.find({ del_flg: { $ne: true } });
  next();
});

export const EmailTemplate = mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);