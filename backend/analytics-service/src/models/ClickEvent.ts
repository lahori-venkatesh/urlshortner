import mongoose, { Document, Schema } from 'mongoose';

export interface IClickEvent extends Document {
  shortCode: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  referer?: string;
  country?: string;
  city?: string;
  device: {
    type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    os: string;
    browser: string;
  };
  isBot: boolean;
  sessionId?: string;
}

const ClickEventSchema = new Schema<IClickEvent>({
  shortCode: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  referer: {
    type: String
  },
  country: {
    type: String
  },
  city: {
    type: String
  },
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    os: {
      type: String,
      default: 'Unknown'
    },
    browser: {
      type: String,
      default: 'Unknown'
    }
  },
  isBot: {
    type: Boolean,
    default: false
  },
  sessionId: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ClickEventSchema.index({ shortCode: 1, timestamp: -1 });
ClickEventSchema.index({ timestamp: -1 });
ClickEventSchema.index({ country: 1 });
ClickEventSchema.index({ 'device.type': 1 });

export const ClickEvent = mongoose.model<IClickEvent>('ClickEvent', ClickEventSchema);