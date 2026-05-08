import { businesses as businessCollection } from '../config/mongoCollections.js';

const checkString = (s, label) => {
  if (typeof s !== 'string') throw `${label} must be a string`;
  s = s.trim();
  if (s.length === 0) throw `${label} cannot be empty`;
  return s;
};

const checkId = (id) => {
  id = checkString(id, 'id');
  return id;
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getAllForMap = async (neighborhood) => {
  const col = await businessCollection();

  const filter = {};
  if (neighborhood !== undefined && neighborhood !== null && String(neighborhood).trim() !== '') {
    const n = checkString(neighborhood, 'neighborhood');
    filter.neighborhood = { $regex: '^' + escapeRegex(n) + '$', $options: 'i' };
  }

  const docs = await col
    .find(filter, { projection: { name: 1, neighborhood: 1, location: 1 } })
    .toArray();

  return docs.map((d) => ({ ...d, _id: d._id.toString() }));
};

export const getByHolidayTag = async (holidayTag) => {
  const tag = checkString(holidayTag, 'holidayTag');
  const col = await businessCollection();

  const pipeline = [
    { $match: { 'products.culture': tag } },
    {
      $addFields: {
        products: {
          $map: {
            input: {
              $filter: {
                input: '$products',
                as:    'p',
                cond:  { $eq: ['$$p.culture', tag] }
              }
            },
            as: 'p',
            in: {
              _id:          '$$p._id',
              name:         '$$p.name',
              culture:      '$$p.culture',
              inStock:      { $ifNull: [{ $last: '$$p.stockReports.inStock' },    false] },
              lastReported: { $ifNull: [{ $last: '$$p.stockReports.reportedAt' }, null]  }
            }
          }
        }
      }
    },
    {
      $project: {
        name: 1,
        neighborhood: 1,
        location: 1,
        category: 1,
        products: 1
      }
    },
    { $sort: { name: 1 } }
  ];

  const docs = await col.aggregate(pipeline).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }));
};

export const getAllHolidayTags = async () => {
  const col = await businessCollection();
  const tags = await col.distinct('products.culture');
  return tags.filter((t) => typeof t === 'string' && t.trim() !== '').sort();
};

export const getById = async (id) => {
  id = checkId(id);
  const col = await businessCollection();
  const doc = await col.findOne({ _id: id });
  if (!doc) throw `No business with id ${id}`;
  return doc;
};

export const getNear = async (lng, lat, meters = 1500) => {
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    throw 'lng and lat must be numbers';
  }
  const col = await businessCollection();
  return col.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: meters
      }
    }
  }).toArray();
};

export const addReview = async (businessId, userId, rating, comment) => {
  businessId = checkId(businessId);
  comment    = checkString(comment, 'comment');
  rating     = parseInt(rating);
  if (isNaN(rating) || rating < 1 || rating > 5) throw 'Rating must be 1-5';

  const col    = await businessCollection();
  const review = {
    _id:       crypto.randomUUID(),
    userId:    String(userId),
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };
  const result = await col.updateOne(
    { _id: businessId },
    { $push: { reviews: review } }
  );
  if (result.matchedCount === 0) throw `No business with id ${businessId}`;
  return review;
};

export const addQuestion = async (businessId, userId, questionText) => {
  businessId   = checkId(businessId);
  questionText = checkString(questionText, 'questionText');

  const col      = await businessCollection();
  const question = {
    _id:          crypto.randomUUID(),
    userId:       String(userId),
    questionText,
    createdAt:    new Date().toISOString(),
    answers:      [],
  };
  const result = await col.updateOne(
    { _id: businessId },
    { $push: { questions: question } }
  );
  if (result.matchedCount === 0) throw `No business with id ${businessId}`;
  return question;
};

export const addAnswer = async (businessId, questionId, userId, answerText) => {
  businessId = checkId(businessId);
  questionId = checkString(questionId, 'questionId');
  answerText = checkString(answerText, 'answerText');

  const col    = await businessCollection();
  const answer = {
    _id:        crypto.randomUUID(),
    userId:     String(userId),
    answerText,
    createdAt:  new Date().toISOString(),
  };
  const result = await col.updateOne(
    { _id: businessId, 'questions._id': questionId },
    { $push: { 'questions.$.answers': answer } }
  );
  if (result.matchedCount === 0) throw `Question or business not found`;
  return answer;
};

export const addStockReport = async (businessId, productId, userId, inStock) => {
  businessId = checkId(businessId);
  productId  = checkString(productId, 'productId');
  if (typeof inStock !== 'boolean') throw 'inStock must be a boolean';

  const col    = await businessCollection();
  const report = {
    userId:     String(userId),
    inStock,
    reportedAt: new Date().toISOString(),
  };
  const result = await col.updateOne(
    { _id: businessId, 'products._id': productId },
    { $push: { 'products.$.stockReports': report } }
  );
  if (result.matchedCount === 0) throw `Product or business not found`;
  return report;
};
