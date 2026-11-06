'use strict';
/* ============================================================
 * Proprint SQL Practice Quiz — shared question engine
 * (loaded by index.html and dashboard.html)
 *
 *  - Seeded RNG: a student's name deterministically generates their quiz
 *  - Question templates: same 10 skills for everyone, details seeded per name
 *  - DATA: expected answers, verified against proprint.sql
 *  - gradeResult: value-tolerant comparison of a query result against the expected result
 * ============================================================ */

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(name) {
  return mulberry32(xmur3(name)());
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/* ============================================================
 * 2. Question data + templates — same skills for everyone, seeded details
 *    Every expected answer below was verified against proprint.sql.
 * ============================================================ */

const CATS = { 1: 'Business Cards', 2: 'Marketing Flyers', 3: 'Banners & Signs', 4: 'Labels & Stickers', 5: 'Promotional Apparel', 6: 'Stationery', 7: 'Packaging' };
const SUPNAME = { 1: 'BigPress Printing Co.', 2: 'BannerWorld Wholesale', 3: 'SignCraft Distributors', 4: 'StickerSource Inc.', 5: 'Heritage Press Works', 7: 'Cascade Digital Print' };

// Verified answer tables (re-verify with the node test if proprint.sql ever changes).
const DATA = {
  // Q1 lookups
  productPrice: {
    'Standard Business Cards (500)': 29.99,
    'Premium Business Cards (500)': 59.99,
    'Glossy Flyers (1000)': 89.99,
    'Vinyl Banner 3x6 ft': 74.99,
    'Retractable Banner Stand': 159.99,
    'Corrugated Yard Sign 18x24': 24.99,
    'Storefront Window Decal': 99.99,
    'Die-Cut Stickers (250)': 44.99,
    'Tissue Paper (480 sheets)': 74.99,
    'Crewneck Sweatshirts (24)': 419.76,
  },
  supplierCity: {
    'BigPress Printing Co.': 'Memphis',
    'BannerWorld Wholesale': 'Reno',
    'StickerSource Inc.': 'San Jose',
    'Heritage Press Works': 'Charlotte',
    'Sunbelt Import Group': 'Denver',
    'Vertex Promo Supply': 'Portland',
  },
  customerCompany: {
    'Priya Shah': 'Shah Catering Co.',
    'Maria Gonzalez': 'Gonzalez Graphics LLC',
    'Sofia Nakamura': 'Valley Dental',
    'Nina Kowalski': 'Cedar Bakery',
    'Malik Slater': 'Union Plumbing',
    'Tessa Chen': 'Evergreen Florist',
  },
  // Q2 equality
  statusCount: { pending: 3, in_production: 5, shipped: 6, delivered: 30, cancelled: 1 },
  carrierCount: { UPS: 9, FedEx: 8, USPS: 12, DHL: 7 },
  lastNamesByCity: {
    Austin: ['Gonzalez', 'Parker'],
    Miami: ['Rahman', 'Reyes', 'Shah', 'Delgado'],
    Minneapolis: ['Whitfield', 'Reyes', 'Kowalski'],
    Milwaukee: ['Lindqvist', 'Haddad', 'Nakamura'],
  },
  // Q3 comparisons (counts)
  priceAbove: { 55: 26, 75: 19, 100: 13, 120: 9, 150: 6 },
  ordersTotalGeq: { 500: 18, 800: 7, 1000: 5 },
  baseRateGeq: { 44000: 15, 47000: 9, 48000: 8 },
  // Q4 order + limit
  topExpensive: ['Embroidered Polos (24)', 'Crewneck Sweatshirts (24)', 'Canvas Tote Bags (100)', 'Custom Shipping Boxes (100)', 'Shopping Bags (250)'],
  cheapestProduct: 'Corrugated Yard Sign 18x24',
  catTopProduct: { 1: ['Cotton Business Cards (500)', 149.99], 2: ['Every Door Direct Postcards', 129.99], 3: ['Retractable Banner Stand', 159.99], 4: ['Product Labels (1000)', 119.99] },
  // Q5 LIKE / NULL
  letterCount: { B: 2, C: 2, D: 4, H: 2, K: 2, N: 4, R: 4, S: 3, W: 2 },
  nullCompanyCount: 5,
  // Q6 aggregates
  statusSum: { pending: 524.93, in_production: 4038.37, shipped: 2024.73, delivered: 15558.72, cancelled: 389.97 },
  avgCat: { 1: 95.99, 2: 97.49, 3: 86.42, 4: 71.99, 5: 383.51, 6: 68.74, 7: 137.49 },
  maxSup: { 1: 129.99, 2: 159.99, 3: 99.99, 4: 119.99, 5: 149.99, 7: 189.99 },
  yearOrders: { 2025: 8, 2026: 37 },
  // Q7 group by
  sourceTop: ['phone', 24],          // website: 21
  statusTopValue: ['delivered', 15558.72], // runner-up: in_production 4038.37
  catMostProducts: [3, 7],           // Banners & Signs; runner-ups: 5
  // Q8 joins
  productSupplier: {
    'Retractable Banner Stand': 'BannerWorld Wholesale',
    'Storefront Window Decal': 'SignCraft Distributors',
    'Product Labels (1000)': 'StickerSource Inc.',
    'Tissue Paper (480 sheets)': 'Cascade Digital Print',
    'Crewneck Sweatshirts (24)': 'Great Lakes Finishing',
    'Custom Shipping Boxes (100)': 'Cascade Digital Print',
  },
  ordersByCity: { 'Kansas City': 7, 'Denver': 6, 'Miami': 3, 'Minneapolis': 3, 'Portland': 3, 'Chicago': 3, 'Charlotte': 3, 'Boise': 3 },
  repByOrder: { 9: 'Omar Haddad', 13: 'Omar Haddad', 20: 'Emily Watson', 28: 'Dan Gonzalez', 32: 'Sarah Kim', 37: 'Sarah Kim', 45: 'Sarah Kim' },
  // Q9 join + group by
  repTopValue2025: ['Marcus Bell', 359.95],  // runner-up: James Ortiz 294.93
  repMostOrders2026: ['Dan Gonzalez', 7],    // runner-up: Dan Ito 6
  stateTopOrders: ['MO', 7],                 // runner-up: CO 6
  // Q10 multi-join + group by
  catTopRevenue: { 2025: ['Banners & Signs', 409.93], 2026: ['Promotional Apparel', 6808.48] },
  catTopUnitsBySource: { phone: ['Business Cards', 23], website: ['Labels & Stickers', 22] },
};

const q1 = (rng) => {
  const v = pick(rng, ['price', 'city', 'company']);
  if (v === 'price') {
    const name = pick(rng, Object.keys(DATA.productPrice));
    return {
      skill: 'Basic SELECT',
      prompt: `What is the price of the product <b>${name}</b>?`,
      expected: [DATA.productPrice[name]],
      ref: `SELECT price FROM products WHERE product_name = '${name}'`,
    };
  }
  if (v === 'city') {
    const s = pick(rng, Object.keys(DATA.supplierCity));
    return {
      skill: 'Basic SELECT',
      prompt: `Which city is the supplier <b>${s}</b> based in?`,
      expected: [DATA.supplierCity[s]],
      ref: `SELECT city FROM suppliers WHERE supplier_name = '${s}'`,
    };
  }
  const c = pick(rng, Object.keys(DATA.customerCompany));
  return {
    skill: 'Basic SELECT',
    prompt: `Which company does the customer <b>${c}</b> order for?`,
    expected: [DATA.customerCompany[c]],
    ref: `SELECT company FROM customers WHERE first_name || ' ' || last_name = '${c}'`,
  };
};

const q2 = (rng) => {
  const v = pick(rng, ['status', 'carrier', 'city']);
  if (v === 'status') {
    const st = pick(rng, Object.keys(DATA.statusCount));
    return {
      skill: 'SELECT + WHERE',
      prompt: `How many orders currently have the status <code>'${st}'</code>?`,
      expected: [DATA.statusCount[st]],
      ref: `SELECT COUNT(*) FROM orders WHERE status = '${st}'`,
    };
  }
  if (v === 'carrier') {
    const c = pick(rng, Object.keys(DATA.carrierCount));
    return {
      skill: 'SELECT + WHERE',
      prompt: `How many shipments did <b>${c}</b> handle?`,
      expected: [DATA.carrierCount[c]],
      ref: `SELECT COUNT(*) FROM shipments WHERE carrier = '${c}'`,
    };
  }
  const city = pick(rng, Object.keys(DATA.lastNamesByCity));
  return {
    skill: 'SELECT + WHERE',
    prompt: `Who are the customers that live in <b>${city}</b>?`,
    expected: DATA.lastNamesByCity[city].slice(),
    ref: `SELECT last_name FROM customers WHERE city = '${city}'`,
  };
};

const q3 = (rng) => {
  const v = pick(rng, ['price', 'total', 'salary']);
  if (v === 'price') {
    const t = pick(rng, Object.keys(DATA.priceAbove));
    return {
      skill: 'WHERE with numbers',
      prompt: `How many products cost more than $${t}.00?`,
      expected: [DATA.priceAbove[t]],
      ref: `SELECT COUNT(*) FROM products WHERE price > ${t}`,
    };
  }
  if (v === 'total') {
    const t = pick(rng, Object.keys(DATA.ordersTotalGeq));
    return {
      skill: 'WHERE with numbers',
      prompt: `How many orders are worth at least $${t}.00?`,
      expected: [DATA.ordersTotalGeq[t]],
      ref: `SELECT COUNT(*) FROM orders WHERE order_total >= ${t}`,
    };
  }
  const t = pick(rng, Object.keys(DATA.baseRateGeq));
  return {
    skill: 'WHERE with numbers',
    prompt: `How many employees earn a base rate of at least $${Number(t).toLocaleString()}?`,
    expected: [DATA.baseRateGeq[t]],
    ref: `SELECT COUNT(*) FROM employees WHERE base_rate >= ${t}`,
  };
};

const q4 = (rng) => {
  const v = pick(rng, ['top1', 'top3', 'cheapest', 'catTop']);
  if (v === 'top1') {
    return {
      skill: 'ORDER BY + LIMIT',
      prompt: `What is the single most expensive product in the catalog?`,
      expected: [DATA.topExpensive[0]],
      ref: `SELECT product_name FROM products ORDER BY price DESC LIMIT 1`,
    };
  }
  if (v === 'top3') {
    return {
      skill: 'ORDER BY + LIMIT',
      prompt: `What are the three most expensive products in the catalog?`,
      expected: DATA.topExpensive.slice(0, 3),
      ref: `SELECT product_name FROM products ORDER BY price DESC LIMIT 3`,
    };
  }
  if (v === 'cheapest') {
    return {
      skill: 'ORDER BY + LIMIT',
      prompt: `What is the cheapest product in the catalog?`,
      expected: [DATA.cheapestProduct],
      ref: `SELECT product_name FROM products ORDER BY price ASC LIMIT 1`,
    };
  }
  const cat = pick(rng, Object.keys(DATA.catTopProduct));
  return {
    skill: 'ORDER BY + LIMIT',
    prompt: `What is the most expensive product in the <i>${CATS[cat]}</i> category, and what does it cost?`,
    expected: DATA.catTopProduct[cat].slice(),
    ref: `SELECT product_name, price FROM products
           WHERE product_category_id = ${cat}
           ORDER BY price DESC LIMIT 1`,
  };
};

const q5 = (rng) => {
  const v = pick(rng, ['letter', 'null']);
  if (v === 'letter') {
    const L = pick(rng, Object.keys(DATA.letterCount));
    return {
      skill: 'Text patterns & NULL',
      prompt: `How many customers have a last name that starts with <b>${L}</b>?`,
      expected: [DATA.letterCount[L]],
      ref: `SELECT COUNT(*) FROM customers WHERE last_name LIKE '${L}%'`,
    };
  }
  return {
    skill: 'Text patterns & NULL',
    prompt: `Some customers are individuals rather than companies — the database simply has
             nothing on file for their employer. How many customers have no company on file?`,
    expected: [DATA.nullCompanyCount],
    ref: `SELECT COUNT(*) FROM customers WHERE company IS NULL`,
  };
};

const q6 = (rng) => {
  const v = pick(rng, ['sum', 'avg', 'max', 'yearcount']);
  if (v === 'sum') {
    const st = pick(rng, Object.keys(DATA.statusSum));
    return {
      skill: 'Aggregates (SUM/COUNT/AVG/MAX)',
      prompt: `What is the combined value, in dollars, of all <code>${st}</code> orders?`,
      expected: [DATA.statusSum[st]],
      ref: `SELECT SUM(order_total) FROM orders WHERE status = '${st}'`,
    };
  }
  if (v === 'avg') {
    const c = pick(rng, Object.keys(DATA.avgCat));
    return {
      skill: 'Aggregates (SUM/COUNT/AVG/MAX)',
      prompt: `What is the average price of products in the <i>${CATS[c]}</i> category, rounded to cents?`,
      expected: [DATA.avgCat[c]],
      ref: `SELECT ROUND(AVG(price), 2) FROM products WHERE product_category_id = ${c}`,
    };
  }
  if (v === 'max') {
    const s = pick(rng, Object.keys(DATA.maxSup));
    return {
      skill: 'Aggregates (SUM/COUNT/AVG/MAX)',
      prompt: `What is the highest price among <i>${SUPNAME[s]}</i>'s products?`,
      expected: [DATA.maxSup[s]],
      ref: `SELECT MAX(price) FROM products WHERE supplier_id = ${s}`,
    };
  }
  const y = pick(rng, Object.keys(DATA.yearOrders));
  return {
    skill: 'Aggregates (SUM/COUNT/AVG/MAX)',
    prompt: `How many orders were placed in <b>${y}</b>?`,
    expected: [DATA.yearOrders[y]],
    ref: `SELECT COUNT(*) FROM orders WHERE order_date LIKE '${y}%'`,
  };
};

const q7 = (rng) => {
  const v = pick(rng, ['source', 'status', 'cat']);
  if (v === 'source') {
    const [who, n] = DATA.sourceTop;
    return {
      skill: 'GROUP BY',
      prompt: `Do customers order more by phone or through the website? Which source accounts for
               more orders, and how many orders is that?`,
      expected: [who, n],
      ref: `SELECT source, COUNT(*) FROM orders GROUP BY source ORDER BY COUNT(*) DESC LIMIT 1`,
    };
  }
  if (v === 'status') {
    const [st, total] = DATA.statusTopValue;
    return {
      skill: 'GROUP BY',
      prompt: `Which order status holds the most total value across all orders, and what is that
               value in dollars?`,
      expected: [st, total],
      ref: `SELECT status, ROUND(SUM(order_total), 2) AS total_value
              FROM orders GROUP BY status ORDER BY SUM(order_total) DESC LIMIT 1`,
    };
  }
  const [cid, n] = DATA.catMostProducts;
  return {
    skill: 'GROUP BY',
    prompt: `Which product category — identified by its <code>product_category_id</code> —
             carries the most products, and how many products is that?`,
    expected: [cid, n],
    ref: `SELECT product_category_id, COUNT(*) FROM products
            GROUP BY product_category_id ORDER BY COUNT(*) DESC LIMIT 1`,
  };
};

const q8 = (rng) => {
  const v = pick(rng, ['prodsup', 'citycount', 'orderrep']);
  if (v === 'prodsup') {
    const p = pick(rng, Object.keys(DATA.productSupplier));
    return {
      skill: 'JOIN',
      prompt: `Who manufactures and supplies the product <b>${p}</b> for Proprint?`,
      expected: [DATA.productSupplier[p]],
      ref: `SELECT s.supplier_name
              FROM products p JOIN suppliers s ON s.id = p.supplier_id
             WHERE p.product_name = '${p}'`,
    };
  }
  if (v === 'citycount') {
    const city = pick(rng, Object.keys(DATA.ordersByCity));
    return {
      skill: 'JOIN',
      prompt: `How many orders were placed by customers who live in <b>${city}</b>?`,
      expected: [DATA.ordersByCity[city]],
      ref: `SELECT COUNT(*) FROM orders o JOIN customers c ON c.id = o.customer_id
             WHERE c.city = '${city}'`,
    };
  }
  const oid = pick(rng, Object.keys(DATA.repByOrder));
  return {
    skill: 'JOIN',
    prompt: `Which employee took order <b>#${oid}</b>?`,
    expected: [DATA.repByOrder[oid]],
    ref: `SELECT e.first_name || ' ' || e.last_name AS rep
            FROM orders o JOIN employees e ON e.id = o.salesperson_id
           WHERE o.id = ${oid}`,
  };
};

const q9 = (rng) => {
  const v = pick(rng, ['rep2025', 'rep2026', 'state']);
  if (v === 'rep2025') {
    const [who, total] = DATA.repTopValue2025;
    return {
      skill: 'JOIN + GROUP BY',
      prompt: `Which sales rep generated the most order value during <b>2025</b> (excluding cancelled
               orders), and what was that value in dollars?`,
      expected: [who, total],
      ref: `SELECT e.first_name || ' ' || e.last_name AS rep, ROUND(SUM(o.order_total), 2) AS total_value
              FROM orders o JOIN employees e ON e.id = o.salesperson_id
             WHERE o.status != 'cancelled' AND o.order_date LIKE '2025%'
             GROUP BY o.salesperson_id
             ORDER BY SUM(o.order_total) DESC LIMIT 1`,
    };
  }
  if (v === 'rep2026') {
    const [who, n] = DATA.repMostOrders2026;
    return {
      skill: 'JOIN + GROUP BY',
      prompt: `Which sales rep took the most orders during <b>2026</b> (excluding cancelled orders),
               and how many orders did they take?`,
      expected: [who, n],
      ref: `SELECT e.first_name || ' ' || e.last_name AS rep, COUNT(*) AS order_count
              FROM orders o JOIN employees e ON e.id = o.salesperson_id
             WHERE o.status != 'cancelled' AND o.order_date LIKE '2026%'
             GROUP BY o.salesperson_id
             ORDER BY COUNT(*) DESC LIMIT 1`,
    };
  }
  const [st, n] = DATA.stateTopOrders;
  return {
    skill: 'JOIN + GROUP BY',
    prompt: `Which state placed the most orders (excluding cancelled ones), and how many orders
             came from there?`,
    expected: [st, n],
    ref: `SELECT c.state, COUNT(*) AS order_count
            FROM orders o JOIN customers c ON c.id = o.customer_id
           WHERE o.status != 'cancelled'
           GROUP BY c.state
           ORDER BY COUNT(*) DESC LIMIT 1`,
  };
};

const q10 = (rng) => {
  const v = pick(rng, ['revenue', 'units']);
  if (v === 'revenue') {
    const y = pick(rng, Object.keys(DATA.catTopRevenue));
    const [cat, rev] = DATA.catTopRevenue[y];
    return {
      skill: 'Multi-join + GROUP BY (grand finale)',
      prompt: `The capstone: revenue by product category. Revenue means the money brought in by
               line items — unit price &times; quantity sold. Which product category brought in the
               most revenue during <b>${y}</b> (excluding cancelled orders), and how much was it?`,
      expected: [cat, rev],
      ref: `SELECT pc.category_name, ROUND(SUM(op.unit_price * op.qty), 2) AS revenue
              FROM orders o
              JOIN order_products op ON op.order_id = o.id
              JOIN products p         ON p.id = op.product_id
              JOIN product_categories pc ON pc.id = p.product_category_id
             WHERE o.status != 'cancelled' AND o.order_date LIKE '${y}%'
             GROUP BY pc.id
             ORDER BY SUM(op.unit_price * op.qty) DESC LIMIT 1`,
    };
  }
  const src = pick(rng, Object.keys(DATA.catTopUnitsBySource));
  const [cat, units] = DATA.catTopUnitsBySource[src];
  return {
    skill: 'Multi-join + GROUP BY (grand finale)',
    prompt: `The capstone: units sold by product category. Which product category sold the most
             units across <b>${src}</b> orders (excluding cancelled orders), and how many units
             was that?`,
    expected: [cat, units],
    ref: `SELECT pc.category_name, SUM(op.qty) AS units_sold
            FROM orders o
            JOIN order_products op ON op.order_id = o.id
            JOIN products p         ON p.id = op.product_id
            JOIN product_categories pc ON pc.id = p.product_category_id
           WHERE o.source = '${src}' AND o.status != 'cancelled'
           GROUP BY pc.id
           ORDER BY SUM(op.qty) DESC LIMIT 1`,
  };
};

const BUILDERS = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10];

function buildQuestions(name) {
  const rng = makeRng(name);
  return BUILDERS.map((build) => build(rng));
}

/* ============================================================
 * 3. Result comparison + query sanity checks
 *    The expected result is shown with the question; the student's query
 *    must return it. Comparison is on values only:
 *    - row order doesn't matter; column order doesn't matter
 *    - numbers compared rounded to cents (so SUM float noise is fine)
 *    - a query must actually read from a table (no literal-only tricks)
 * ============================================================ */
const TABLES = ['customers', 'employees', 'orders', 'order_products', 'shipments', 'products', 'product_categories', 'suppliers'];

function normVal(v) {
  if (v === null || v === undefined) return '#';
  if (typeof v === 'number') return Number.isFinite(v) ? 'n:' + (Math.round(v * 100) / 100) : 'v:' + v;
  const s = String(v).trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) return 'n:' + (Math.round(parseFloat(s) * 100) / 100);
  return 's:' + s;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// got / expected: { columns: [...], values: [[...]...] }
// returns true, or a human-readable reason string
function gradeResult(got, expected) {
  const gCols = got.columns.length || (got.values[0] || []).length;
  const eCols = expected.columns.length || (expected.values[0] || []).length;
  const gRows = got.values.length;
  const eRows = expected.values.length;
  if (gCols !== eCols) {
    return gRows === 0
      ? 'your query returned no rows — the expected result has ' + eRows + ' row' + (eRows === 1 ? '' : 's') + ' and ' + eCols + ' column' + (eCols === 1 ? '' : 's') + ' (check your tables and columns)'
      : 'your query returns ' + gCols + ' column' + (gCols === 1 ? '' : 's') + ', but the expected result has ' + eCols + ' — check which columns you SELECT';
  }
  const exact = got.values.map(r => r.map(normVal).join('\u0001')).sort();
  const expExact = expected.values.map(r => r.map(normVal).join('\u0001')).sort();
  const perm = got.values.map(r => r.map(normVal).sort().join('\u0001')).sort();
  const expPerm = expected.values.map(r => r.map(normVal).sort().join('\u0001')).sort();
  if (arraysEqual(exact, expExact) || arraysEqual(perm, expPerm)) return true;
  if (gRows === 0) return 'your query returned 0 rows — check your WHERE conditions (the expected result has ' + eRows + ' row' + (eRows === 1 ? '' : 's') + ')';
  if (gRows === eRows) return 'you return the right number of rows (' + eRows + '), but the values do not match';
  return gRows < eRows
    ? 'you return ' + gRows + ' row' + (gRows === 1 ? '' : 's') + ' but ' + eRows + ' are expected — your WHERE is probably too strict'
    : 'you return ' + gRows + ' row' + (gRows === 1 ? '' : 's') + ' but only ' + eRows + ' are expected — your WHERE is probably too loose';
}

// A quiz query should read from at least one real table — blocks trivial
// "SELECT 'x' UNION 'y'" style shortcuts that just retype the shown answer.
function queryMentionsTable(sql) {
  const bare = String(sql).replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  return TABLES.some((t) => new RegExp('\\b' + t + '\\b', 'i').test(bare));
}
