import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { ObjectId } from "mongodb";
import { users } from "../config/mongoCollections.js";

const saltRounds = 10;



export const registerUser = async (
  firstName,
  lastName,
  email,
  password
) => {
  const collection = await users();

  email = email.toLowerCase();

  const existing =
    await collection.findOne({ email });

  if (existing)
    throw "User already exists";

  const hashedPassword =
    await bcrypt.hash(
      password,
      saltRounds
    );

  const role =
    email === "admin@nyc.com"
      ? "admin"
      : "user";

  await collection.insertOne({
    _id: uuid(),
    firstName,
    lastName,
    email,
    hashedPassword,
    role,
    followedCultures: [],
    mustBuyList: []
  });
};



export const loginUser = async (
  email,
  password
) => {
  const collection = await users();

  email = email.toLowerCase();

  const user =
    await collection.findOne({ email });

  if (!user)
    throw "Invalid Login";

  const match =
    await bcrypt.compare(
      password,
      user.hashedPassword
    );

  if (!match)
    throw "Invalid Login";



  if (
    email === "admin@nyc.com" &&
    user.role !== "admin"
  ) {
    await collection.updateOne(
      { email },
      {
        $set: {
          role: "admin"
        }
      }
    );

    user.role = "admin";
  }

  return user;
};



export const getUser = async (id) => {
  const collection = await users();

  let user = await collection.findOne({ _id: id });
  if (!user && /^[a-f\d]{24}$/i.test(id)) {
    user = await collection.findOne({ _id: new ObjectId(id) });
  }
  return user;
};



export const addCulture = async (
  id,
  culture
) => {
  const collection = await users();

  await collection.updateOne(
    { _id: id },
    {
      $addToSet: {
        followedCultures: culture
      }
    }
  );
};



export const removeCulture = async (
  id,
  culture
) => {
  const collection = await users();

  await collection.updateOne(
    { _id: id },
    {
      $pull: {
        followedCultures: culture
      }
    }
  );
};



export const addMustBuy = async (
  id,
  item
) => {
  const collection = await users();

  await collection.updateOne(
    { _id: id },
    {
      $addToSet: {
        mustBuyList: item
      }
    }
  );
};



export const removeMustBuy = async (
  id,
  item
) => {
  const collection = await users();

  await collection.updateOne(
    { _id: id },
    {
      $pull: {
        mustBuyList: item
      }
    }
  );
};



export const generateResetToken = async (email) => {
  const collection = await users();

  email = email.toLowerCase();

  const user = await collection.findOne({ email });
  if (!user) throw "No account found with that email";

  const token = uuid();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await collection.updateOne(
    { email },
    {
      $set: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    }
  );

  return token;
};



export const resetPassword = async (token, newPassword) => {
  const collection = await users();

  const user = await collection.findOne({ resetPasswordToken: token });

  if (!user) throw "Invalid or expired reset link";
  if (user.resetPasswordExpires < new Date()) throw "Reset link has expired";

  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await collection.updateOne(
    { resetPasswordToken: token },
    {
      $set: { hashedPassword },
      $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
    }
  );
};
