import mongoose, { Document, Schema } from 'mongoose';

export interface IBuyerProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  tel: string;
  zip1: string;
  zip2: string;
  address1: string;
  address2: string;
  point: number;
  del_flg: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BuyerProfileSchema = new Schema<IBuyerProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'User ID is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  tel: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\d-+().\s]+$/, 'Please enter a valid phone number']
  },
  zip1: {
    type: String,
    required: [true, 'Zip code (first part) is required'],
    trim: true,
    match: [/^\d{3}$/, 'Zip1 must be 3 digits']
  },
  zip2: {
    type: String,
    required: [true, 'Zip code (second part) is required'],
    trim: true,
    match: [/^\d{4}$/, 'Zip2 must be 4 digits']
  },
  address1: {
    type: String,
    required: [true, 'Address1 is required'],
    trim: true,
    maxlength: [200, 'Address1 cannot exceed 200 characters']
  },
  address2: {
    type: String,
    trim: true,
    maxlength: [200, 'Address2 cannot exceed 200 characters']
  },
  point: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative'],
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
BuyerProfileSchema.index({ userId: 1 }, { unique: true });
BuyerProfileSchema.index({ del_flg: 1 });
BuyerProfileSchema.index({ point: -1 });

// Query middleware to exclude soft deleted documents by default
BuyerProfileSchema.pre(/^find/, function(next) {
  // @ts-ignore
  this.find({ del_flg: { $ne: true } });
  next();
});

export const BuyerProfile = mongoose.model<IBuyerProfile>('BuyerProfile', BuyerProfileSchema);