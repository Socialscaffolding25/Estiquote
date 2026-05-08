// ================================================================
// ESTIQUOTE — Merchant Branch Finder
// Uses postcodes.io for lat/lng, region detection
// Works on Node 16+ (uses https module, no fetch dependency)
// ================================================================

const https = require('https');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Invalid JSON response')); }
      });
    }).on('error', reject);
  });
}

// Simple in-memory rate limiter (resets on cold start, good enough for abuse prevention)
const rateLimitMap = {};
const RATE_LIMIT = 10; // max requests per IP per minute
const RATE_WINDOW = 60000;

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimitMap[ip]) rateLimitMap[ip] = [];
  // Clear old entries outside window
  rateLimitMap[ip] = rateLimitMap[ip].filter(t => now - t < RATE_WINDOW);
  if (rateLimitMap[ip].length >= RATE_LIMIT) return false;
  rateLimitMap[ip].push(now);
  // Clean up old IPs occasionally
  if (Object.keys(rateLimitMap).length > 1000) {
    Object.keys(rateLimitMap).forEach(k => {
      if (rateLimitMap[k].every(t => now - t > RATE_WINDOW)) delete rateLimitMap[k];
    });
  }
  return true;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Rate limiting
  const clientIp = event.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
    || event.headers?.['client-ip']
    || 'unknown';

  if (!checkRateLimit(clientIp)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' })
    };
  }

  const { postcode, material } = event.queryStringParameters || {};

  if (!postcode) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'postcode required' }) };
  }

  // Resolve postcode via postcodes.io
  let lat = null, lng = null, region = 'South East England';
  try {
    const pc = postcode.replace(/\s/g, '').toUpperCase();
    const data = await httpGet(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    if (data.status === 200 && data.result) {
      lat = data.result.latitude;
      lng = data.result.longitude;
      region = data.result.region || data.result.country || 'South East England';
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Postcode not found. Please check and try again.' }) };
    }
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Could not look up postcode. Please try again.' }) };
  }

  const pc = postcode.toUpperCase().replace(/\s/g, '');
  const pcSpaced = pc.replace(/^([A-Z]{1,2}[0-9]{1,2}[A-Z]?)([0-9][A-Z]{2})$/, '$1 $2');
  const matQ = material ? encodeURIComponent(material) : '';

  const merchants = [
    {
      id: 'jewson', name: 'Jewson', shortName: 'J',
      color: '#c8102e', bg: 'rgba(200,16,46,0.1)',
      bestFor: 'Full range — timber, heavyside, plumbing, roofing',
      tradeAccount: true, nationwide: true,
      branchFinderUrl: `https://www.jewson.co.uk/branch-finder?postcode=${pc}`,
      searchUrl: matQ ? `https://www.jewson.co.uk/search?query=${matQ}` : 'https://www.jewson.co.uk',
      website: 'https://www.jewson.co.uk', phone: '0800 539 766', approxBranches: 500,
    },
    {
      id: 'travis', name: 'Travis Perkins', shortName: 'TP',
      color: '#005baa', bg: 'rgba(0,91,170,0.1)',
      bestFor: 'Timber, heavyside, tool hire, national accounts',
      tradeAccount: true, nationwide: true,
      branchFinderUrl: `https://www.travisperkins.co.uk/branch-finder?postcode=${pc}`,
      searchUrl: matQ ? `https://www.travisperkins.co.uk/search?term=${matQ}` : 'https://www.travisperkins.co.uk',
      website: 'https://www.travisperkins.co.uk', phone: '0844 892 2001', approxBranches: 500,
    },
    {
      id: 'screwfix', name: 'Screwfix', shortName: 'SF',
      color: '#003087', bg: 'rgba(0,48,135,0.1)',
      bestFor: 'Fixings, tools, plumbing — click & collect in 1 minute',
      tradeAccount: false, nationwide: true,
      branchFinderUrl: `https://www.screwfix.com/stores/find?postcode=${pc}`,
      searchUrl: matQ ? `https://www.screwfix.com/search?search=${matQ}` : 'https://www.screwfix.com',
      website: 'https://www.screwfix.com', phone: '03330 112 112', approxBranches: 800,
    },
    {
      id: 'wickes', name: 'Wickes', shortName: 'W',
      color: '#00953a', bg: 'rgba(0,149,58,0.1)',
      bestFor: 'Smaller orders, kitchens, bathrooms, click & collect',
      tradeAccount: false, nationwide: true,
      branchFinderUrl: `https://www.wickes.co.uk/store-finder?postcode=${pcSpaced}`,
      searchUrl: matQ ? `https://www.wickes.co.uk/search?term=${matQ}` : 'https://www.wickes.co.uk',
      website: 'https://www.wickes.co.uk', phone: '0333 600 5000', approxBranches: 230,
    },
    {
      id: 'buildbase', name: 'Buildbase', shortName: 'B',
      color: '#ff6b00', bg: 'rgba(255,107,0,0.1)',
      bestFor: 'Local pricing, independent service, account flexibility',
      tradeAccount: true, nationwide: true,
      branchFinderUrl: `https://www.buildbase.co.uk/branches?postcode=${pc}`,
      searchUrl: matQ ? `https://www.buildbase.co.uk/search?q=${matQ}` : 'https://www.buildbase.co.uk',
      website: 'https://www.buildbase.co.uk', phone: '01865 369 369', approxBranches: 180,
    },
    {
      id: 'mkm', name: 'MKM Building Supplies', shortName: 'MKM',
      color: '#1f618d', bg: 'rgba(31,97,141,0.1)',
      bestFor: 'Strong in North England — branch ownership model, local expertise',
      tradeAccount: true, nationwide: true,
      branchFinderUrl: `https://www.mkmbs.co.uk/find-a-branch?postcode=${pc}`,
      searchUrl: matQ ? `https://www.mkmbs.co.uk/search?q=${matQ}` : 'https://www.mkmbs.co.uk',
      website: 'https://www.mkmbs.co.uk', phone: '01482 323 053', approxBranches: 100,
    },
    {
      id: 'selco', name: 'Selco Builders Warehouse', shortName: 'S',
      color: '#e74c3c', bg: 'rgba(231,76,60,0.1)',
      bestFor: 'Trade warehouse pricing — best for volume buying',
      tradeAccount: true, nationwide: true,
      branchFinderUrl: `https://www.selcobw.com/branch-finder?postcode=${pc}`,
      searchUrl: matQ ? `https://www.selcobw.com/search?q=${matQ}` : 'https://www.selcobw.com',
      website: 'https://www.selcobw.com', phone: '0333 014 9999', approxBranches: 70,
    },
    {
      id: 'huwsgray', name: 'Huws Gray', shortName: 'HG',
      color: '#1a5276', bg: 'rgba(26,82,118,0.1)',
      bestFor: 'Strong in Wales, North West and Midlands',
      tradeAccount: true, nationwide: false,
      regions: ['Wales', 'North West England', 'Yorkshire and The Humber', 'East Midlands', 'West Midlands'],
      branchFinderUrl: `https://www.huwsgray.co.uk/branches?postcode=${pc}`,
      searchUrl: matQ ? `https://www.huwsgray.co.uk/search?q=${matQ}` : 'https://www.huwsgray.co.uk',
      website: 'https://www.huwsgray.co.uk', phone: '01248 362 062', approxBranches: 250,
    },
    {
      id: 'parkers', name: 'Parker Building Supplies', shortName: 'P',
      color: '#7d3c98', bg: 'rgba(125,60,152,0.1)',
      bestFor: 'SE England specialist — Sussex and Kent local knowledge',
      tradeAccount: true, nationwide: false,
      regions: ['South East England'],
      branchFinderUrl: `https://www.parkerbs.com/branch-locator?postcode=${pc}`,
      searchUrl: matQ ? `https://www.parkerbs.com/search?query=${matQ}` : 'https://www.parkerbs.com',
      website: 'https://www.parkerbs.com', phone: '01273 400707', approxBranches: 20,
    },
    {
      id: 'fairalls', name: 'Fairalls Builders Merchants', shortName: 'F',
      color: '#7d6608', bg: 'rgba(125,102,8,0.1)',
      bestFor: 'Surrey & Kent heavyside — largest dry brick stock in SE',
      tradeAccount: true, nationwide: false,
      regions: ['South East England'],
      branchFinderUrl: 'https://fairalls.uk/branch-locator',
      searchUrl: matQ ? `https://fairalls.uk/search?q=${matQ}` : 'https://fairalls.uk',
      website: 'https://fairalls.uk', phone: '01883 571004', approxBranches: 4,
    },
    {
      id: 'marwood', name: 'Marwood Group', shortName: 'MW',
      color: '#196f3d', bg: 'rgba(25,111,61,0.1)',
      bestFor: 'Yorkshire & North East — strong heavyside and timber',
      tradeAccount: true, nationwide: false,
      regions: ['Yorkshire and The Humber', 'North East England'],
      branchFinderUrl: 'https://www.marwoodgroup.co.uk/branches',
      searchUrl: 'https://www.marwoodgroup.co.uk',
      website: 'https://www.marwoodgroup.co.uk', phone: '01482 321 123', approxBranches: 12,
    },
    {
      id: 'chandlers', name: 'Chandlers Building Supplies', shortName: 'C',
      color: '#a04000', bg: 'rgba(160,64,0,0.1)',
      bestFor: 'East Sussex & Kent independent — strong local delivery',
      tradeAccount: true, nationwide: false,
      regions: ['South East England'],
      branchFinderUrl: 'https://www.chandlersbs.co.uk/branches',
      searchUrl: 'https://www.chandlersbs.co.uk',
      website: 'https://www.chandlersbs.co.uk', phone: '01323 440 077', approxBranches: 8,
    },
  ];

  // Filter to relevant merchants based on region
  const relevant = merchants.filter(m => {
    if (m.nationwide) return true;
    if (!m.regions) return true;
    return m.regions.some(r => region.includes(r) || r.includes(region));
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      postcode: pcSpaced,
      lat, lng, region,
      material: material || null,
      merchants: relevant,
      totalMerchants: relevant.length,
    })
  };
};
