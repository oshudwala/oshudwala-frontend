import fs from 'fs';
import path from 'path';
import readline from 'readline';

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i+1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCategory(raw) {
  if (!raw || raw === 'null' || raw === 'undefined') return 'General & Allopathic Medicines';
  let cat = raw.trim().replace(/^"|"$/g, '').replace(/[–—]/g, '-');

  if (cat.includes('Other allopathic medicines')) {
    return 'General & Allopathic Medicines';
  }
  if (cat.includes('Pain, fever')) {
    return 'Pain, Fever & Anti-inflammatory';
  }
  if (cat.includes('Eye, ear')) {
    return 'Eye, Ear, Nose & Throat (ENT)';
  }
  if (cat.includes('Women’s health') || cat.includes("Women's health")) {
    return "Women's Health & Gynaecology";
  }
  if (cat.includes('Urology & men’s') || cat.includes("Urology & men's")) {
    return "Urology & Men's Health";
  }
  if (cat.includes('Respiratory & cough')) {
    return 'Respiratory & Cough / Cold';
  }
  if (cat.includes('Vaccines, biologics')) {
    return 'Vaccines & Immunologicals';
  }

  const microList = [
    'Supports & braces', 'Baby hygiene', 'Mobility & rehabilitation', 'Feeding & accessories',
    'Daily oral hygiene', 'Dressings & bandages', 'Tapes & antiseptic supplies', 'Monitoring devices',
    'Patient care consumables', 'Minerals', 'Specialty supplements', 'Targeted cosmetic care',
    'Bath & body', 'Daily hygiene', 'Respiratory & therapy devices', 'Injection & infusion consumables',
    'Moisturisers & barrier care', 'Disposable protective products', 'Health retail accessories',
    'Oral nutrition', 'Mother & maternity care', 'Ayurvedic product families', 'Cleansers',
    'Shampoo & conditioner', 'Hair treatment & styling', 'Menstrual care', 'Non-medicinal accessories',
    'Hydration & digestive nutrition', 'Sun protection', 'Home tests & sexual wellness',
    'Denture & specialised care', 'Pet hygiene & accessories', 'Skin protection & cleansing accessories',
    'Home test products', 'Homeopathic product families', 'Infant nutrition (regulated)', 'Vitamins'
  ];

  if (microList.some((m) => cat.toLowerCase().includes(m.toLowerCase()))) {
    return 'Medical Devices, Consumables & Wellness';
  }

  return cat;
}

export async function generateStockShards() {
  const csvPath = path.resolve('public/Stock List.csv');
  const outputDir = path.resolve('public/stock-data');

  if (!fs.existsSync(csvPath)) {
    console.warn('Stock List.csv not found at', csvPath);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  const categoriesMap = new Map();
  const popularList = [];

  const popularKeywords = [
    'paracetamol', 'dolo 650', 'augmentin 625', 'pan 40', 'pantoprazole', 'azithral 500', 'azithromycin',
    'allegra 120', 'avil 25', 'telma 40', 'concor 2.5', 'rosuvas 10', 'ecosprin 75', 'glycomet gp',
    'metformin 500', 'shelcal 500', 'calcium 500', 'becosules', 'neurobion forte', 'limcee 500',
    'montair-lc', 'ascoril ls', 'ascoril-d', 'asthalin', 'candid-b', 'nadoxin', 'betnovate-n',
    'volini', 'combiflam', 'zerodol-sp', 'ultracet', 'omez 20', 'rantac 150', 'digene', 'cremaffin',
    'cefix 200', 'ciplox 500', 'amoxyclav 625', 'azee 500', 'atarax 25', 'crocin', 'calpol 650',
    'amlong 5', 'atorva 10', 'janumet', 'galvus met', 'supradyn daily', 'vicks vaporub'
  ];

  for await (const line of rl) {
    count++;
    if (count === 1) continue;
    const cols = parseCSVLine(line);

    const id = cols[0] || `MED-${count}`;
    const category = normalizeCategory(cols[2]);
    const name = (cols[3] || '').trim();
    if (!name) continue;

    const generic = (cols[4] || '').trim();
    const form = (cols[7] || 'Tablet').trim();
    const pack = (cols[8] || 'Standard Pack').trim();
    const mfg = (cols[9] || 'Certified Manufacturer').trim();
    const mrp = parseFloat(cols[10]) || 0;

    const item = {
      id,
      name,
      category,
      generic,
      form,
      pack,
      mfg,
      mrp: Number(mrp.toFixed(2)),
    };

    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, []);
    }
    categoriesMap.get(category).push(item);

    const nameLower = name.toLowerCase();
    if (popularList.length < 5000) {
      if (popularKeywords.some((kw) => nameLower.includes(kw))) {
        popularList.push(item);
      }
    }
  }

  const categoriesList = [];
  for (const [catName, items] of categoriesMap.entries()) {
    const slug = slugify(catName) || 'general';
    categoriesList.push({
      name: catName,
      slug,
      count: items.length,
    });
  }

  categoriesList.sort((a, b) => b.count - a.count);

  fs.writeFileSync(
    path.join(outputDir, 'categories.json'),
    JSON.stringify(categoriesList, null, 2),
    'utf8'
  );

  fs.writeFileSync(
    path.join(outputDir, 'popular-catalog.json'),
    JSON.stringify(popularList),
    'utf8'
  );

  for (const cat of categoriesList) {
    const items = categoriesMap.get(cat.name);
    const fileName = `category-${cat.slug}.json`;
    fs.writeFileSync(
      path.join(outputDir, fileName),
      JSON.stringify(items),
      'utf8'
    );
  }

  console.log(`[stock-shards] Successfully compiled ${count - 1} medicines across ${categoriesList.length} categories.`);
}

if (process.argv[1] && process.argv[1].endsWith('generateStockShards.js')) {
  generateStockShards();
}
