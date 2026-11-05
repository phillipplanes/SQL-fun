-- ============================================================
-- Proprint Order System — SQLite Schema + Dummy Data
-- (source database for the SQL Practice Quiz)
-- Tables: customers, employees, orders, order_products,
--         shipments, products, product_categories, suppliers
-- ============================================================

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS order_products;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_categories;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS employees;

-- ------------------------------------------------------------
-- 1. Customers
-- ------------------------------------------------------------
CREATE TABLE customers (
    id          INTEGER PRIMARY KEY,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    company     TEXT,
    address     TEXT,
    city        TEXT,
    state       TEXT,
    zip         TEXT,
    phone       TEXT,
    email       TEXT,
    created_on  TEXT
);

-- ------------------------------------------------------------
-- 2. Employees (sales reps / CSR staff)
-- ------------------------------------------------------------
CREATE TABLE employees (
    id               INTEGER PRIMARY KEY,
    first_name       TEXT NOT NULL,
    last_name        TEXT NOT NULL,
    email            TEXT,
    phone            TEXT,
    base_rate        NUMERIC,
    commission_level NUMERIC,
    status           TEXT CHECK (status IN ('active', 'terminated')),
    start_date       TEXT,
    termination_date TEXT
);

-- ------------------------------------------------------------
-- 3. Suppliers (who supply the printed goods)
-- ------------------------------------------------------------
CREATE TABLE suppliers (
    id            INTEGER PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    contact_name  TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address       TEXT,
    city          TEXT,
    state         TEXT,
    zip           TEXT
);

-- ------------------------------------------------------------
-- 4. Product categories
-- ------------------------------------------------------------
CREATE TABLE product_categories (
    id                  INTEGER PRIMARY KEY,
    category_name       TEXT NOT NULL UNIQUE,
    category_description TEXT
);

-- ------------------------------------------------------------
-- 5. Products (FK: supplier_id, product_category_id)
-- ------------------------------------------------------------
CREATE TABLE products (
    id                  INTEGER PRIMARY KEY,
    product_name        TEXT NOT NULL,
    description         TEXT,
    price               NUMERIC,
    supplier_id         INTEGER NOT NULL REFERENCES suppliers(id),
    product_category_id INTEGER NOT NULL REFERENCES product_categories(id)
);

-- ------------------------------------------------------------
-- 6. Orders (FK: customer_id, salesperson_id)
-- ------------------------------------------------------------
CREATE TABLE orders (
    id             INTEGER PRIMARY KEY,
    customer_id    INTEGER NOT NULL REFERENCES customers(id),
    order_date     TEXT,
    order_total    NUMERIC,
    salesperson_id INTEGER NOT NULL REFERENCES employees(id),
    source         TEXT CHECK (source IN ('phone', 'website')),
    status         TEXT CHECK (status IN ('pending', 'in_production', 'shipped', 'delivered', 'cancelled'))
);

-- ------------------------------------------------------------
-- 7. Order products — line items (FK: order_id, product_id, employee_id)
-- ------------------------------------------------------------
CREATE TABLE order_products (
    id          INTEGER PRIMARY KEY,
    order_id    INTEGER NOT NULL REFERENCES orders(id),
    product_id  INTEGER NOT NULL REFERENCES products(id),
    unit_price  NUMERIC,
    qty         INTEGER,
    employee_id INTEGER NOT NULL REFERENCES employees(id)
);

-- ------------------------------------------------------------
-- 8. Shipments — drop-ship tracking (FK: order_id)
-- ------------------------------------------------------------
CREATE TABLE shipments (
    id              INTEGER PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    carrier         TEXT,
    tracking_number TEXT,
    date_shipped    TEXT,
    date_received   TEXT,
    status          TEXT CHECK (status IN ('pre_transit', 'in_transit', 'delivered', 'exception'))
);

-- ============================================================
-- DUMMY DATA
-- ============================================================

-- Customers
INSERT INTO customers (id, first_name, last_name, company, address, city, state, zip, phone, email, created_on) VALUES
 (1, 'Maria',  'Gonzalez', 'Gonzalez Graphics LLC',    '120 Cedar St',    'Austin',       'TX', '78701', '512-555-0142', 'maria@gonzalezgraphics.com',  '2025-01-15'),
 (2, 'Dan',    'Whitfield','Whitfield Realty',        '88 Oak Ridge Rd', 'Denver',       'CO', '80202', '303-555-0177', 'dan@whitfieldrealty.com',     '2025-02-03'),
 (3, 'Priya',  'Shah',     'Shah Catering Co.',       '45 Harbor Ln',    'Chicago',      'IL', '60601', '312-555-0193', 'priya@shahcatering.com',       '2025-03-21'),
 (4, 'Tom',    'Baker',    'Baker Fitness Studio',    '9 Hilltop Ave',   'Portland',     'OR', '97201', '503-555-0126', 'tom@bakerfitness.com',        '2025-04-10'),
 (5, 'Alicia', 'Nguyen',   'Nguyen Legal Group',      '301 Court Sq',    'Atlanta',      'GA', '30301', '404-555-0158', 'alicia@nguyenlegal.com',       '2025-05-02'),
 (6, 'Chris',  'Doyle',    NULL,                      '17 Maple Dr',     'Boise',        'ID', '83702', '208-555-0134', 'chris.doyle@email.com',        '2025-06-18'),
 (7, 'Felix', 'Whitfield', NULL, '915 Hilltop Ave', 'Minneapolis', 'MN', '55480', '720-555-0197', 'felix.whitfield@email.com', '2025-08-05'),
 (8, 'Caleb', 'Chen', 'Evergreen Repair Shop', '772 Lakeview Dr', 'Salt Lake City', 'UT', '84132', '702-555-0127', 'caleb@evergreenrepairshop.com', '2026-04-11'),
 (9, 'Dan', 'Parker', NULL, '359 Oak Ridge Rd', 'Austin', 'TX', '78786', '818-555-0160', 'dan.parker@email.com', '2026-10-26'),
 (10, 'Omar', 'Lindqvist', NULL, '676 Court Sq', 'Milwaukee', 'WI', '53272', '720-555-0103', 'omar.lindqvist@email.com', '2026-06-18'),
 (11, 'Dan', 'Rahman', 'Juniper Moving Co.', '35 Fairview Rd', 'Miami', 'FL', '33160', '702-555-0192', 'dan@junipermovingco.com', '2026-08-18'),
 (12, 'Priya', 'Reyes', 'Orchard Food Truck', '534 Ridge Rd', 'Miami', 'FL', '33171', '801-555-0142', 'priya@orchardfoodtruck.com', '2026-09-19'),
 (13, 'Leo', 'Reyes', 'Yellowtail Kitchen', '946 Oak Ridge Rd', 'Denver', 'CO', '80219', '818-555-0185', 'leo@yellowtailkitchen.com', '2026-03-28'),
 (14, 'Omar', 'Ivanov', 'Pinnacle Repair Shop', '388 Maple Dr', 'Portland', 'OR', '97288', '917-555-0184', 'omar@pinnaclerepairshop.com', '2025-07-24'),
 (15, 'Omar', 'Osei', 'Acme Tutoring', '85 Fairview Rd', 'Phoenix', 'AZ', '85083', '415-555-0199', 'omar@acmetutoring.com', '2025-10-16'),
 (16, 'Omar', 'Doyle', 'Bluebird Music School', '865 Cedar St', 'Charlotte', 'NC', '28273', '702-555-0179', 'omar@bluebirdmusicschool.com', '2025-01-09'),
 (17, 'Diego', 'Nguyen', 'Ximena Florist', '835 Harbor Ln', 'Seattle', 'WA', '98179', '512-555-0105', 'diego@ximenaflorist.com', '2026-08-05'),
 (18, 'Hannah', 'Reyes', 'Ironwood Kitchen', '141 Pine Hollow', 'Minneapolis', 'MN', '55453', '212-555-0100', 'hannah@ironwoodkitchen.com', '2026-01-23'),
 (19, 'Noah', 'Shah', 'Maple Auto Care', '522 Court Sq', 'Miami', 'FL', '33179', '212-555-0103', 'noah@mapleautocare.com', '2025-06-14'),
 (20, 'Felix', 'Haddad', 'Union Consulting', '196 Hilltop Ave', 'Raleigh', 'NC', '27624', '615-555-0161', 'felix@unionconsulting.com', '2026-04-20'),
 (21, 'Priya', 'Haddad', 'Ximena Brewing', '645 Ridge Rd', 'Milwaukee', 'WI', '53247', '305-555-0108', 'priya@ximenabrewing.com', '2025-07-12'),
 (22, 'Fatima', 'Nguyen', 'Union Plumbing', '103 Stonebridge Way', 'Seattle', 'WA', '98157', '801-555-0198', 'fatima@unionplumbing.com', '2026-08-25'),
 (23, 'Yusuf', 'Delgado', 'Bluebird Moving Co.', '807 Cedar St', 'Charlotte', 'NC', '28229', '917-555-0129', 'yusuf@bluebirdmovingco.com', '2025-03-19'),
 (24, 'Sofia', 'Nakamura', 'Valley Dental', '398 Summit Ave', 'Milwaukee', 'WI', '53270', '702-555-0123', 'sofia@valleydental.com', '2026-03-05'),
 (25, 'Nina', 'Kowalski', 'Cedar Bakery', '933 Ridge Rd', 'Minneapolis', 'MN', '55420', '972-555-0185', 'nina@cedarbakery.com', '2026-08-22'),
 (26, 'Malik', 'Slater', 'Union Plumbing', '318 Birch Ln', 'Kansas City', 'MO', '64175', '404-555-0124', 'malik@unionplumbing.com', '2025-07-04'),
 (27, 'Leo', 'Delgado', NULL, '164 Maple Dr', 'Miami', 'FL', '33116', '312-555-0135', 'leo.delgado@email.com', '2025-02-13'),
 (28, 'Maria', 'Baker', 'Union Repair Shop', '268 Maple Dr', 'Tucson', 'AZ', '85786', '702-555-0105', 'maria@unionrepairshop.com', '2025-09-10'),
 (29, 'Tessa', 'Chen', 'Evergreen Florist', '215 Birch Ln', 'Phoenix', 'AZ', '85062', '720-555-0185', 'tessa@evergreenflorist.com', '2025-04-08'),
 (30, 'Gabe', 'Kowalski', 'Riverbend Auto Care', '480 Meadow Ln', 'Salt Lake City', 'UT', '84176', '212-555-0177', 'gabe@riverbendautocare.com', '2025-03-10');

-- Employees (5 = one per sales team; #6 terminated)
INSERT INTO employees (id, first_name, last_name, email, phone, base_rate, commission_level, status, start_date, termination_date) VALUES
 (1, 'Sarah',  'Kim',     'sarah.kim@proprint.com',     '555-0101', 45000.00, 0.05, 'active',     '2021-03-01', NULL),
 (2, 'James',  'Ortiz',   'james.ortiz@proprint.com',   '555-0102', 48000.00, 0.06, 'active',     '2020-07-15', NULL),
 (3, 'Emily',  'Watson',  'emily.watson@proprint.com',  '555-0103', 42000.00, 0.05, 'active',     '2022-01-10', NULL),
 (4, 'Marcus', 'Bell',    'marcus.bell@proprint.com',   '555-0104', 50000.00, 0.07, 'active',     '2019-11-05', NULL),
 (5, 'Lena',   'Foster',  'lena.foster@proprint.com',   '555-0105', 44000.00, 0.05, 'active',     '2023-05-22', NULL),
 (6, 'Viktor', 'Petrov',  'viktor.petrov@proprint.com', '555-0106', 40000.00, 0.04, 'terminated', '2018-06-01', '2025-04-30'),
 (7, 'Uma', 'Turner', 'uma.turner@proprint.com', '555-0107', 47000.00, 0.07, 'terminated', '2022-10-08', '2025-07-25'),
 (8, 'Fatima', 'Patel', 'fatima.patel@proprint.com', '555-0108', 50000.00, 0.07, 'terminated', '2018-12-06', '2025-06-13'),
 (9, 'Dan', 'Gonzalez', 'dan.gonzalez@proprint.com', '555-0109', 44000.00, 0.05, 'active', '2018-05-16', NULL),
 (10, 'Gabe', 'Delgado', 'gabe.delgado@proprint.com', '555-0110', 52000.00, 0.04, 'active', '2024-06-04', NULL),
 (11, 'Omar', 'Haddad', 'omar.haddad@proprint.com', '555-0111', 48000.00, 0.07, 'active', '2022-12-01', NULL),
 (12, 'Wren', 'Haddad', 'wren.haddad@proprint.com', '555-0112', 46000.00, 0.04, 'active', '2021-12-15', NULL),
 (13, 'Omar', 'Osei', 'omar.osei@proprint.com', '555-0113', 42000.00, 0.04, 'active', '2022-05-16', NULL),
 (14, 'Dan', 'Farouk', 'dan.farouk@proprint.com', '555-0114', 45000.00, 0.06, 'active', '2018-12-26', NULL),
 (15, 'Wren', 'Brandt', 'wren.brandt@proprint.com', '555-0115', 54000.00, 0.07, 'active', '2023-12-08', NULL),
 (16, 'Dan', 'Ito', 'dan.ito@proprint.com', '555-0116', 49000.00, 0.06, 'active', '2020-12-18', NULL),
 (17, 'Alicia', 'Whitfield', 'alicia.whitfield@proprint.com', '555-0117', 45000.00, 0.07, 'terminated', '2020-03-24', '2025-03-17'),
 (18, 'Leo', 'Osei', 'leo.osei@proprint.com', '555-0118', 52000.00, 0.06, 'terminated', '2024-11-07', '2025-07-25');

-- Suppliers
INSERT INTO suppliers (id, supplier_name, contact_name, contact_phone, contact_email, address, city, state, zip) VALUES
 (1, 'BigPress Printing Co.',    'Ray Hollis',   '800-555-0201', 'ray@bigpress.com',      '500 Industrial Pkwy', 'Memphis',    'TN', '38101'),
 (2, 'BannerWorld Wholesale',    'Nina Alvarez','800-555-0202', 'nina@bannerworld.com',   '72 Mill Rd',           'Reno',       'NV', '89501'),
 (3, 'SignCraft Distributors',   'Otto Meyer',   '800-555-0203', 'otto@signcraft.com',     '940 Depot St',         'Columbus',   'OH', '43215'),
 (4, 'StickerSource Inc.',       'Amy Chen',     '800-555-0204', 'amy@stickersource.com', '210 Bond Ct',          'San Jose',   'CA', '95112'),
 (5, 'Heritage Press Works', 'Uma Nguyen', '800-555-0305', 'uma@heritage.com', '651 Lakeview Dr', 'Charlotte', 'NC', '28284'),
 (6, 'Northline Paper Corp', 'Tessa Parker', '800-555-0306', 'tessa@northline.com', '833 Willow Way', 'Minneapolis', 'MN', '55464'),
 (7, 'Cascade Digital Print', 'Nina Okafor', '800-555-0307', 'nina@cascade.com', '97 Oak Ridge Rd', 'Raleigh', 'NC', '27688'),
 (8, 'Great Lakes Finishing', 'Felix Rahman', '800-555-0308', 'felix@greatlakes.com', '6 Oak Ridge Rd', 'Milwaukee', 'WI', '53230'),
 (9, 'Sunbelt Import Group', 'Dan Delgado', '800-555-0309', 'dan@sunbelt.com', '87 Meadow Ln', 'Denver', 'CO', '80257'),
 (10, 'Vertex Promo Supply', 'Chris Lindqvist', '800-555-0310', 'chris@vertex.com', '42 Fairview Rd', 'Portland', 'OR', '97243');

-- Product categories
INSERT INTO product_categories (id, category_name, category_description) VALUES
 (1, 'Business Cards', 'Standard and premium business card printing'),
 (2, 'Marketing Flyers', 'Promotional flyers and postcards'),
 (3, 'Banners & Signs', 'Large-format banners, yard and storefront signs'),
 (4, 'Labels & Stickers', 'Die-cut stickers, product labels, decals'),
 (5, 'Promotional Apparel', 'Screen-printed and embroidered shirts, caps, totes'),
 (6, 'Stationery', 'Letterheads, envelopes, notepads, greeting cards'),
 (7, 'Packaging', 'Custom boxes, mailers, shopping bags, tissue paper');

-- Products (each tied to a supplier and a category)
INSERT INTO products (id, product_name, description, price, supplier_id, product_category_id) VALUES
 (1,  'Standard Business Cards (500)',  '14pt gloss, 4/4 color, 3.5x2 in',              29.99, 1, 1),
 (2,  'Premium Business Cards (500)',   '16pt matte with spot UV, 3.5x2 in',             59.99, 1, 1),
 (3,  'Glossy Flyers (1000)',            '8.5x11 in, 100lb gloss book, 4/4',              89.99, 1, 2),
 (4,  'Every Door Direct Postcards',    '6.5x9 in postcards, EDDM-ready',                129.99, 1, 2),
 (5,  'Vinyl Banner 3x6 ft',            '13oz outdoor vinyl, grommets included',        74.99, 2, 3),
 (6,  'Retractable Banner Stand',       '33x80 in with aluminum stand',                 159.99, 2, 3),
 (7,  'Corrugated Yard Sign 18x24',      '4mm coroplast with wire stake',                 24.99, 3, 3),
 (8,  'Storefront Window Decal',         'Perforated vinyl, custom cut',                 99.99, 3, 3),
 (9,  'Die-Cut Stickers (250)',          'Custom shape, vinyl, weatherproof',             44.99, 4, 4),
 (10, 'Product Labels (1000)',           'Roll labels, custom size, gloss finish',       119.99, 4, 4),
 (11, 'Round Stickers (500)', 'Custom die-cut circle, weatherproof vinyl', 79.99, 4, 4),
 (12, 'Clear Bumper Stickers (250)', 'Transparent vinyl, outdoor rated', 54.99, 4, 4),
 (13, 'Foam Board Sign 24x36', '3/16 in foam core, full color', 34.99, 3, 3),
 (14, 'Mesh Banner 4x8 ft', 'Wind-through mesh, grommets included', 119.99, 2, 3),
 (15, 'A-Frame Sidewalk Sign', '24x36 plastic frame with two inserts', 89.99, 3, 3),
 (16, 'Tri-Fold Brochures (500)', '8.5x11, 100lb gloss, folded', 99.99, 1, 2),
 (17, 'Rack Cards (1000)', '4x9, 14pt gloss, UV coating', 69.99, 1, 2),
 (18, 'Letterhead (1000)', '70lb uncoated text, 8.5x11', 74.99, 5, 6),
 (19, '#10 Envelopes (1000)', '24lb white wove, printed return address', 64.99, 5, 6),
 (20, 'Custom Note Pads (250)', '4x6, 50 sheets, glued top', 49.99, 5, 6),
 (21, 'Greeting Cards (250)', 'A2 size, 14pt matte, blank inside', 84.99, 5, 6),
 (22, 'Cotton Business Cards (500)', '32pt duplexed cotton, letterpress', 149.99, 5, 1),
 (23, 'Foil Stamped Cards (500)', '19pt with gold or silver foil', 129.99, 6, 1),
 (24, 'Raised Spot UV Cards (500)', '19pt SUV with glossy raised accents', 109.99, 6, 1),
 (25, 'Hang Tags (500)', '2x3.5, 16pt, string included', 59.99, 6, 4),
 (26, 'Custom Shipping Boxes (100)', '12x12x8 corrugated, 1-color print', 189.99, 7, 7),
 (27, 'Kraft Mailers (250)', '9x6 padded mailers, logo printed', 119.99, 7, 7),
 (28, 'Shopping Bags (250)', '13x16 glossy, rope handles', 164.99, 7, 7),
 (29, 'Tissue Paper (480 sheets)', '20x30, logo repeat pattern', 74.99, 7, 7),
 (30, 'Crewneck Sweatshirts (24)', '50/50 blend, 1-color front print', 419.76, 8, 5),
 (31, 'Embroidered Polos (24)', 'Moisture-wicking, left-chest logo', 431.76, 8, 5),
 (32, 'Canvas Tote Bags (100)', '12oz natural canvas, 1-color print', 299.00, 8, 5);

-- Orders (customer_id, salesperson_id all reference rows above)
INSERT INTO orders (id, customer_id, order_date, order_total, salesperson_id, source, status) VALUES
 (1, 1, '2025-07-01', 149.97, 1, 'phone',   'delivered'),
 (2, 2, '2025-07-08', 219.94, 2, 'website', 'delivered'),
 (3, 3, '2025-08-02',  89.99, 1, 'website', 'delivered'),
 (4, 4, '2025-08-15', 219.97, 3, 'phone',   'shipped'),
 (5, 5, '2025-09-05', 359.95, 4, 'website', 'in_production'),
 (6, 1, '2025-09-20',  74.99, 2, 'phone',   'shipped'),
 (7, 6, '2025-09-28',  44.99, 5, 'website', 'pending'),
 (8, 4, '2025-10-03', 119.98, 5, 'website', 'pending'),
 (9, 2, '2026-08-26', 439.96, 11, 'phone', 'delivered'),
 (10, 7, '2026-05-26', 626.09, 15, 'phone', 'delivered'),
 (11, 26, '2026-09-17', 689.91, 12, 'website', 'shipped'),
 (12, 21, '2026-07-20', 389.97, 12, 'website', 'cancelled'),
 (13, 15, '2026-03-16', 979.93, 11, 'phone', 'delivered'),
 (14, 26, '2026-02-19', 49.99, 11, 'phone', 'delivered'),
 (15, 26, '2026-09-19', 419.95, 16, 'phone', 'shipped'),
 (16, 6, '2026-07-12', 204.98, 1, 'website', 'delivered'),
 (17, 27, '2026-09-13', 214.97, 13, 'website', 'shipped'),
 (18, 5, '2026-09-26', 29.99, 9, 'website', 'in_production'),
 (19, 2, '2026-04-16', 239.97, 9, 'phone', 'delivered'),
 (20, 6, '2026-07-07', 384.94, 3, 'phone', 'delivered'),
 (21, 3, '2026-01-14', 379.98, 3, 'phone', 'delivered'),
 (22, 30, '2026-08-25', 404.94, 10, 'website', 'shipped'),
 (23, 26, '2026-03-02', 544.92, 16, 'website', 'delivered'),
 (24, 29, '2026-08-23', 649.93, 3, 'website', 'delivered'),
 (25, 1, '2026-06-05', 129.58, 9, 'website', 'delivered'),
 (26, 26, '2026-03-15', 404.97, 2, 'phone', 'delivered'),
 (27, 21, '2026-03-10', 319.97, 16, 'phone', 'delivered'),
 (28, 23, '2026-03-25', 1089.56, 9, 'website', 'delivered'),
 (29, 27, '2026-06-26', 569.97, 9, 'phone', 'delivered'),
 (30, 25, '2026-09-14', 1079.48, 10, 'website', 'in_production'),
 (31, 2, '2026-01-19', 598.00, 9, 'phone', 'delivered'),
 (32, 28, '2026-03-24', 2053.99, 1, 'phone', 'delivered'),
 (33, 26, '2026-06-02', 599.96, 16, 'phone', 'delivered'),
 (34, 18, '2026-09-19', 889.91, 9, 'website', 'in_production'),
 (35, 3, '2026-01-07', 173.52, 2, 'website', 'delivered'),
 (36, 2, '2026-09-07', 1679.04, 16, 'website', 'in_production'),
 (37, 26, '2026-03-25', 519.95, 1, 'phone', 'delivered'),
 (38, 16, '2026-02-09', 662.93, 2, 'website', 'delivered'),
 (39, 22, '2026-10-23', 359.96, 3, 'website', 'pending'),
 (40, 4, '2026-01-10', 179.97, 15, 'phone', 'delivered'),
 (41, 19, '2026-01-11', 354.96, 4, 'phone', 'delivered'),
 (42, 16, '2026-02-21', 659.96, 12, 'phone', 'delivered'),
 (43, 30, '2026-02-06', 269.96, 12, 'phone', 'delivered'),
 (44, 5, '2026-04-25', 575.64, 16, 'phone', 'delivered'),
 (45, 2, '2026-05-24', 1435.24, 1, 'phone', 'delivered');

-- Order products (line items; unit_price captured at time of sale)
INSERT INTO order_products (id, order_id, product_id, unit_price, qty, employee_id) VALUES
 (1,  1, 1, 29.99,  2, 1),   -- Maria: 2x standard cards
 (2,  1, 3, 89.99,  1, 1),   -- Maria: glossy flyers
 (3,  2, 5, 74.99,  1, 2),   -- Dan: vinyl banner
 (4,  2, 7, 24.99,  4, 2),   -- Dan: 4 yard signs
 (5,  2, 9, 44.99,  1, 2),   -- Dan: stickers
 (6,  3, 3, 89.99,  1, 1),   -- Priya: flyers
 (7,  4, 6, 159.99, 1, 3),   -- Tom: banner stand
 (8,  4, 1, 29.99,  2, 3),   -- Tom: cards
 (9,  5, 2, 59.99,  4, 4),   -- Alicia: 4x premium cards
 (10, 5, 10, 119.99, 1, 4),  -- Alicia: labels
 (11, 6, 5, 74.99,  1, 2),   -- Maria: vinyl banner
 (12, 7, 9, 44.99,  1, 5),   -- Chris: stickers
 (13, 8, 3, 89.99,  1, 5),   -- Tom: flyers
 (14, 8, 9, 29.99,  1, 5),   -- Tom: second sticker line, sale price
 (15, 9, 24, 109.99, 4, 11),
 (16, 10, 12, 54.99, 4, 15),
 (17, 10, 21, 84.99, 3, 15),
 (18, 10, 9, 37.79, 4, 15),
 (19, 11, 27, 119.99, 3, 12),
 (20, 11, 19, 64.99, 3, 12),
 (21, 11, 9, 44.99, 3, 12),
 (22, 12, 23, 129.99, 3, 12),
 (23, 13, 22, 149.99, 4, 11),
 (24, 13, 14, 119.99, 1, 11),
 (25, 13, 4, 129.99, 2, 11),
 (26, 14, 20, 49.99, 1, 11),
 (27, 15, 1, 29.99, 2, 16),
 (28, 15, 14, 119.99, 3, 16),
 (29, 16, 21, 84.99, 1, 1),
 (30, 16, 10, 119.99, 1, 1),
 (31, 17, 5, 74.99, 1, 13),
 (32, 17, 25, 59.99, 1, 13),
 (33, 17, 11, 79.99, 1, 13),
 (34, 18, 1, 29.99, 1, 9),
 (35, 19, 10, 119.99, 1, 9),
 (36, 19, 2, 59.99, 2, 9),
 (37, 20, 20, 42.49, 2, 3),
 (38, 20, 29, 74.99, 4, 3),
 (39, 21, 26, 189.99, 2, 3),
 (40, 22, 2, 59.99, 3, 10),
 (41, 22, 5, 74.99, 3, 10),
 (42, 23, 7, 24.99, 2, 16),
 (43, 23, 19, 64.99, 3, 16),
 (44, 23, 8, 99.99, 3, 16),
 (45, 24, 28, 164.99, 2, 3),
 (46, 24, 21, 84.99, 2, 3),
 (47, 24, 20, 49.99, 3, 3),
 (48, 25, 11, 64.79, 2, 9),
 (49, 26, 14, 119.99, 1, 2),
 (50, 26, 28, 164.99, 1, 2),
 (51, 26, 10, 119.99, 1, 2),
 (52, 27, 8, 99.99, 2, 16),
 (53, 27, 27, 119.99, 1, 16),
 (54, 28, 4, 116.99, 1, 9),
 (55, 28, 21, 84.99, 3, 9),
 (56, 28, 32, 239.20, 3, 9),
 (57, 29, 26, 189.99, 3, 9),
 (58, 30, 2, 59.99, 4, 10),
 (59, 30, 30, 419.76, 2, 10),
 (60, 31, 32, 299.00, 2, 9),
 (61, 32, 30, 419.76, 4, 1),
 (62, 32, 21, 84.99, 3, 1),
 (63, 32, 5, 59.99, 2, 1),
 (64, 33, 22, 149.99, 4, 16),
 (65, 34, 14, 119.99, 4, 9),
 (66, 34, 20, 49.99, 1, 9),
 (67, 34, 3, 89.99, 4, 9),
 (68, 35, 19, 57.84, 3, 2),
 (69, 36, 30, 419.76, 4, 16),
 (70, 37, 21, 84.99, 3, 1),
 (71, 37, 8, 99.99, 1, 1),
 (72, 37, 28, 164.99, 1, 1),
 (73, 38, 10, 119.99, 3, 2),
 (74, 38, 11, 79.99, 3, 2),
 (75, 38, 17, 62.99, 1, 2),
 (76, 39, 10, 119.99, 1, 3),
 (77, 39, 11, 79.99, 3, 3),
 (78, 40, 2, 59.99, 3, 15),
 (79, 41, 16, 99.99, 3, 4),
 (80, 41, 12, 54.99, 1, 4),
 (81, 42, 28, 164.99, 4, 12),
 (82, 43, 11, 79.99, 2, 12),
 (83, 43, 12, 54.99, 2, 12),
 (84, 44, 28, 141.89, 3, 16),
 (85, 44, 20, 49.99, 3, 16),
 (86, 45, 31, 431.76, 3, 1),
 (87, 45, 13, 34.99, 4, 1);

-- Shipments (only for orders that have shipped; Proprint drop-ships direct to customer)
INSERT INTO shipments (id, order_id, carrier, tracking_number, date_shipped, date_received, status) VALUES
 (1, 1, 'UPS',    '1Z999AA10123456784', '2025-07-03', '2025-07-06', 'delivered'),
 (2, 2, 'FedEx',  '771234567890',       '2025-07-10', '2025-07-14', 'delivered'),
 (3, 3, 'USPS',   '9405511899223197',   '2025-08-04', '2025-08-06', 'delivered'),
 (4, 4, 'UPS',    '1Z999AA10987654321', '2025-08-18', NULL,         'in_transit'),
 (5, 6, 'FedEx',  '771234567891',       '2025-09-22', NULL,          'in_transit'),
 (6, 9, 'USPS', '94055119749048', '2026-08-31', '2026-09-04', 'delivered'),
 (7, 10, 'DHL', 'JD00029199249', '2026-05-29', '2026-05-31', 'delivered'),
 (8, 11, 'FedEx', '77123452658041', '2026-09-20', NULL, 'in_transit'),
 (9, 13, 'UPS', '1Z999AA19945876', '2026-03-21', '2026-03-23', 'delivered'),
 (10, 14, 'DHL', 'JD00024490632', '2026-02-22', '2026-03-01', 'delivered'),
 (11, 15, 'DHL', 'JD00023575920', '2026-09-24', NULL, 'in_transit'),
 (12, 16, 'DHL', 'JD00024377379', '2026-07-14', '2026-07-18', 'delivered'),
 (13, 17, 'USPS', '94055116309306', '2026-09-15', NULL, 'in_transit'),
 (14, 19, 'UPS', '1Z999AA18029974', '2026-04-21', '2026-04-25', 'delivered'),
 (15, 20, 'FedEx', '77123456810244', '2026-07-12', '2026-07-16', 'delivered'),
 (16, 21, 'DHL', 'JD00021920887', '2026-01-19', '2026-01-24', 'delivered'),
 (17, 22, 'UPS', '1Z999AA18798601', '2026-08-28', NULL, 'in_transit'),
 (18, 23, 'UPS', '1Z999AA16377548', '2026-03-06', '2026-03-12', 'delivered'),
 (19, 24, 'FedEx', '77123457503088', '2026-08-25', '2026-08-28', 'delivered'),
 (20, 25, 'FedEx', '77123458151808', '2026-06-10', '2026-06-17', 'delivered'),
 (21, 26, 'USPS', '94055118677606', '2026-03-20', '2026-03-25', 'delivered'),
 (22, 27, 'FedEx', '77123451781087', '2026-03-14', '2026-03-20', 'delivered'),
 (23, 28, 'USPS', '94055113264081', '2026-03-28', '2026-04-03', 'delivered'),
 (24, 29, 'USPS', '94055119422568', '2026-06-28', '2026-07-03', 'delivered'),
 (25, 31, 'DHL', 'JD00028325069', '2026-01-24', '2026-01-31', 'delivered'),
 (26, 32, 'FedEx', '77123456194595', '2026-03-27', '2026-04-03', 'delivered'),
 (27, 33, 'USPS', '94055112250780', '2026-06-06', '2026-06-11', 'delivered'),
 (28, 35, 'USPS', '94055111373588', '2026-01-11', '2026-01-15', 'delivered'),
 (29, 37, 'UPS', '1Z999AA11246836', '2026-03-30', '2026-04-03', 'delivered'),
 (30, 38, 'UPS', '1Z999AA12284170', '2026-02-11', '2026-02-15', 'delivered'),
 (31, 40, 'DHL', 'JD00023946361', '2026-01-12', '2026-01-17', 'delivered'),
 (32, 41, 'USPS', '94055116029840', '2026-01-13', '2026-01-15', 'delivered'),
 (33, 42, 'USPS', '94055111054491', '2026-02-24', '2026-03-01', 'delivered'),
 (34, 43, 'USPS', '94055116465816', '2026-02-08', '2026-02-10', 'delivered'),
 (35, 44, 'USPS', '94055119234163', '2026-04-27', '2026-05-03', 'delivered'),
 (36, 45, 'UPS', '1Z999AA11839281', '2026-05-27', '2026-05-31', 'delivered');
