import mongoose, { Document, Schema } from 'mongoose';

export interface IContactRequest extends Document {
  _id: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  type: 'update-info' | 'general-inquiry' | 'complaint';
  content: string;
  adminResponse?: string;
  status: 'pending' | 'done';
  del_flg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactRequestSchema = new Schema<IContactRequest>({
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Buyer ID is required']
  },
  type: {
    type: String,
    enum: ['update-info', 'general-inquiry', 'complaint'],
    required: [true, 'Contact request type is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [1000, 'Content cannot exceed 1000 characters']
  },
  adminResponse: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin response cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'done'],
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
ContactRequestSchema.index({ buyerId: 1, createdAt: -1 });
ContactRequestSchema.index({ status: 1 });
ContactRequestSchema.index({ type: 1 });
ContactRequestSchema.index({ del_flg: 1 });

// Query middleware to exclude soft deleted documents by default
ContactRequestSchema.pre(/^find/, function(next) {
  // @ts-ignore
  this.find({ del_flg: { $ne: true } });
  next();
});

export const ContactRequest = mongoose.model<IContactRequest>('ContactRequest', ContactRequestSchema);