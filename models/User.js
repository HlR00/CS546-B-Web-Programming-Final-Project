import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const userSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  hashedPassword: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  followedCultures: { type: [String], default: [] },
  mustBuyList: { type: [String], default: [] }
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.hashedPassword;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', userSchema);
