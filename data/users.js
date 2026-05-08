import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { users } from "../config/mongoCollections.js";

const saltRounds = 10;

const checkString = (val, label) => {
  if (typeof val !== 'string') throw `${label} must be a string`;
  val = val.trim();
  if (val.length === 0) throw `${label} cannot be empty`;
  return val;
};

const checkEmail = (email) => {
  email = checkString(email, 'Email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw 'Invalid email format';
  if (email.length > 200) throw 'Email is too long';
  return email.toLowerCase();
};

const checkPassword = (password) => {
  if (typeof password !== 'string') throw 'Password must be a string';
  if (password.length < 8) throw 'Password must be at least 8 characters';
  if (password.length > 128) throw 'Password is too long';
  return password;
};

const checkName = (val, label) => {
  val = checkString(val, label);
  if (val.length > 50) throw `${label} must be 50 characters or fewer`;
  if (!/^[a-zA-Z\s'-]+$/.test(val))
    throw `${label} may only contain letters, spaces, hyphens, and apostrophes`;
  return val;
};

export const registerUser = async (firstName, lastName, email, password) => {
  firstName = checkName(firstName, 'First name');
  lastName  = checkName(lastName, 'Last name');
  email     = checkEmail(email);
  password  = checkPassword(password);

  const collection = await users();

  const existing = await collection.findOne({ email });
  if (existing) throw 'An account with this email already exists';

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const role = email === 'admin@nyc.com' ? 'admin' : 'user';

  await collection.insertOne({
    firstName,
    lastName,
    email,
    hashedPassword,
    role,
    followedCultures: [],
    mustBuyList: [],
  });
};

export const loginUser = async (email, password) => {
  email = checkEmail(email);
  if (typeof password !== 'string' || password.trim().length === 0)
    throw 'Password is required';

  const collection = await users();
  const user = await collection.findOne({ email });

  if (!user) throw 'Invalid email or password';

  const match = await bcrypt.compare(password, user.hashedPassword);
  if (!match) throw 'Invalid email or password';

  if (email === 'admin@nyc.com' && user.role !== 'admin') {
    await collection.updateOne({ email }, { $set: { role: 'admin' } });
    user.role = 'admin';
  }

  return user;
};

export const getUser = async (id) => {
  const collection = await users();
  return await collection.findOne({ _id: new ObjectId(id) });
};

export const addCulture = async (id, culture) => {
  culture = checkString(culture, 'Culture');
  if (culture.length > 100) throw 'Culture name must be 100 characters or fewer';

  const collection = await users();
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $addToSet: { followedCultures: culture } }
  );
};

export const removeCulture = async (id, culture) => {
  culture = checkString(culture, 'Culture');

  const collection = await users();
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $pull: { followedCultures: culture } }
  );
};

export const addMustBuy = async (id, item) => {
  item = checkString(item, 'Item');
  if (item.length > 200) throw 'Item name must be 200 characters or fewer';

  const collection = await users();
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $addToSet: { mustBuyList: item } }
  );
};

export const removeMustBuy = async (id, item) => {
  item = checkString(item, 'Item');

  const collection = await users();
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $pull: { mustBuyList: item } }
  );
};
