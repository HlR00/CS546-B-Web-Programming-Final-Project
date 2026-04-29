import { dbConnection } from './mongoConnection.js';

const getCollection = (name) => async () => {
  const db = await dbConnection();
  return db.collection(name);
};

export const businesses = getCollection('businesses');
export const users      = getCollection('users');
