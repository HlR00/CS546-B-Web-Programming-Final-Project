import crypto from "crypto";
import bcrypt from "bcrypt";
import { users } from "../config/mongoCollections.js";

const saltRounds = 10;



export const registerUser = async (
  firstName,
  lastName,
  email,
  password
) => {
  const collection = await users();

  firstName = firstName.trim();
  lastName = lastName.trim();
  email = email.toLowerCase().trim();

  const existing =
    await collection.findOne({
      email
    });

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

  const newUser = {
    _id: crypto.randomUUID(),    firstName,
    lastName,
    email,
    hashedPassword,
    role,
    followedCultures: [],
    mustBuyList: []
  };

  await collection.insertOne(newUser);

  return newUser;
};



export const loginUser = async (
  email,
  password
) => {
  const collection = await users();

  email = email.toLowerCase().trim();

  const user =
    await collection.findOne({
      email
    });

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

  const user =
    await collection.findOne({
      _id: id
    });

  if (!user)
    throw "User not found";

  return user;
};



export const addCulture = async (
  id,
  culture
) => {
  const collection = await users();

  culture = culture.trim();

  await collection.updateOne(
    { _id: id },
    {
      $addToSet: {
        followedCultures: culture
      }
    }
  );

  return true;
};



export const removeCulture = async (
  id,
  culture
) => {
  const collection = await users();

  culture = culture.trim();

  await collection.updateOne(
    { _id: id },
    {
      $pull: {
        followedCultures: culture
      }
    }
  );

  return true;
};



export const addMustBuy = async (
  id,
  item
) => {
  const collection = await users();

  item = item.trim();

  await collection.updateOne(
    { _id: id },
    {
      $addToSet: {
        mustBuyList: item
      }
    }
  );

  return true;
};



export const removeMustBuy = async (
  id,
  item
) => {
  const collection = await users();

  item = item.trim();

  await collection.updateOne(
    { _id: id },
    {
      $pull: {
        mustBuyList: item
      }
    }
  );

  return true;
};