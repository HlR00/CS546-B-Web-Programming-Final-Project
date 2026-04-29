/* ============================================================================
 * data/businesses.js  —  NYC Roots & Flavors (Role 4)
 * ----------------------------------------------------------------------------
 * Data-access layer. All MongoDB queries for the Map + Seasonal Tracker live
 * here, so routes stay thin (lecture pattern: routes → data → collection).
 *
 * Schema assumption (matches the group's proposal):
 *   businesses: {
 *     _id, name, neighborhood,
 *     location: { type: "Point", coordinates: [lng, lat] },   // GeoJSON
 *     products: [
 *       {
 *         _id, itemName, inStock, lastReported, holidayTag    // sub-doc
 *       }
 *     ],
 *     ...
 *   }
 *
 * We assume two indexes will exist (create them in your seed script):
 *   db.businesses.createIndex({ location: "2dsphere" })
 *   db.businesses.createIndex({ "products.holidayTag": 1 })
 * ========================================================================== */

import { businesses as businessCollection } from '../config/mongoCollections.js';

/* ---------- Tiny input validation (lecture style) ----------------------- */
const checkString = (s, label) => {
  if (typeof s !== 'string') throw `${label} must be a string`;
  s = s.trim();
  if (s.length === 0)       throw `${label} cannot be empty`;
  return s;
};

const checkId = (id) => {
  id = checkString(id, 'id');
  return id;
};

/* ---------- QUERY 1: every business, for the map ------------------------ */
/**
 * Returns only the fields the map needs, to keep the payload small.
 * Optionally filters by NYC neighborhood (exact match, case-insensitive).
 */
export const getAllForMap = async (neighborhood) => {
  const col = await businessCollection();

  const filter = {};
  if (neighborhood !== undefined && neighborhood !== null && String(neighborhood).trim() !== '') {
    const n = checkString(neighborhood, 'neighborhood');
    // Anchored, case-insensitive exact match — safer than storing raw user input.
    filter.neighborhood = { $regex: '^' + escapeRegex(n) + '$', $options: 'i' };
  }

  // Projection: map only needs id, name, neighborhood, location.
  const docs = await col
    .find(filter, { projection: { name: 1, neighborhood: 1, location: 1 } })
    .toArray();

  // Stringify _id for easy use in the frontend.
  return docs.map((d) => ({ ...d, _id: d._id.toString() }));
};

/* ---------- QUERY 2: businesses that sell a holiday item --------------- */
/**
 * Seasonal Tracker: return businesses that have AT LEAST one product whose
 * `holidayTag` matches the requested tag (e.g. "Lunar New Year", "Diwali",
 * "Ramadan", "Christmas", "Passover").
 *
 * Implementation notes:
 *   • We use `{ "products.holidayTag": tag }` on the outer find so Mongo can
 *     use the compound index. That quickly returns the matching BUSINESSES.
 *   • Then aggregation narrows each business's `products` array down to
 *     just the matching items, so the UI only shows the relevant products
 *     (not every item the shop carries).
 */
export const getByHolidayTag = async (holidayTag) => {
  const tag = checkString(holidayTag, 'holidayTag');
  const col = await businessCollection();

  const pipeline = [
    // 1. Cheap index-friendly prefilter.
    { $match: { 'products.culture': tag } },

    // 2. Keep only the matching products in each business doc,
    //    and flatten inStock/lastReported from the stockReports array
    //    so the Handlebars template can use them directly.
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
              // Take the last stock report's values; default to false/null if none.
              inStock:      { $ifNull: [{ $last: '$$p.stockReports.inStock' },      false] },
              lastReported: { $ifNull: [{ $last: '$$p.stockReports.reportedAt' },   null]  }
            }
          }
        }
      }
    },

    // 3. Project just what the seasonal page needs.
    {
      $project: {
        name: 1,
        neighborhood: 1,
        location: 1,
        category: 1,
        products: 1
      }
    },

    // 4. In-stock businesses first, then alphabetically.
    { $sort: { name: 1 } }
  ];

  const docs = await col.aggregate(pipeline).toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }));
};

/* ---------- QUERY 3: list of available holiday tags -------------------- */
/**
 * Powers the <select> dropdown in the Seasonal Tracker UI.
 * Distinct is fast and requires no aggregation.
 */
export const getAllHolidayTags = async () => {
  const col = await businessCollection();
  const tags = await col.distinct('products.culture');
  return tags.filter((t) => typeof t === 'string' && t.trim() !== '').sort();
};

/* ---------- QUERY 4: single business by id (for detail page) ----------- */
export const getById = async (id) => {
  id = checkId(id);
  const col = await businessCollection();
  const doc = await col.findOne({ _id: id });
  if (!doc) throw `No business with id ${id}`;
  return doc;
};

/* ---------- QUERY 5 (bonus): geospatial "near me" ---------------------- */
/**
 * Demonstrates the 2dsphere index. Not required for the base assignment,
 * but a nice stretch goal if time permits.
 */
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

/* ---------- internal: regex safety ------------------------------------- */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
