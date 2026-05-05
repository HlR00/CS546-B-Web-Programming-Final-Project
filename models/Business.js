import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const stockReportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  inStock: { type: Boolean, required: true },
  reportedAt: { type: Date, default: Date.now }
}, { _id: false });

const productSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  culture: { type: String },
  stockReports: { type: [stockReportSchema], default: [] }
});

const reviewSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  userId: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const answerSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  userId: { type: String, required: true },
  answerText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const questionSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  userId: { type: String, required: true },
  questionText: { type: String, required: true },
  answers: { type: [answerSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const businessSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  name: { type: String, required: true },
  category: { type: String },
  dataSource: { type: String },
  neighborhood: { type: String },
  address: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  healthGrade: { type: String },
  isVerified: { type: Boolean, default: false },
  products: { type: [productSchema], default: [] },
  reviews: { type: [reviewSchema], default: [] },
  questions: { type: [questionSchema], default: [] }
}, { timestamps: true });

businessSchema.index({ location: '2dsphere' });
businessSchema.index({ category: 1 });
businessSchema.index({ neighborhood: 1 });
businessSchema.index({ 'products.culture': 1 });

export default mongoose.model('Business', businessSchema);
