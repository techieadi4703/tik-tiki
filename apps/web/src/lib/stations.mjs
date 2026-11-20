export const MAJOR_STATIONS_CATALOG = [
  // ==========================================
  // METROPOLITAN AREA CLUSTERS (All Stations & Airports)
  // ==========================================
  {
    code: 'MUMBAI',
    name: 'Mumbai (All Stations & Airports)',
    city: 'Mumbai',
    country: 'IN',
    type: 'city_hub',
    is_major_hub: true,
    stations_included: ['CSMT', 'LTT', 'BDTS', 'MMCT', 'PNVL', 'DR', 'BOM'],
    subtitle: 'Includes CSMT, LTT, Bandra (BDTS), Panvel, Central & BOM Airport',
  },
  {
    code: 'DELHI',
    name: 'Delhi NCR (All Stations & Airports)',
    city: 'New Delhi',
    country: 'IN',
    type: 'city_hub',
    is_major_hub: true,
    stations_included: ['NDLS', 'NZM', 'DLI', 'ANVT', 'DEC', 'DEL'],
    subtitle: 'Includes New Delhi (NDLS), Nizamuddin, Old Delhi, Anand Vihar & DEL Airport',
  },
  {
    code: 'VARANASI',
    name: 'Varanasi Area (All Stations & Airports)',
    city: 'Varanasi',
    country: 'IN',
    type: 'city_hub',
    is_major_hub: true,
    stations_included: ['BSB', 'BSBS', 'DDU', 'VNS'],
    subtitle: 'Includes Varanasi Jn (BSB), Banaras (BSBS), Pt. Deen Dayal (DDU) & VNS Airport',
  },
  {
    code: 'PRAYAGRAJ',
    name: 'Prayagraj Area (All Stations & Airports)',
    city: 'Prayagraj',
    country: 'IN',
    type: 'city_hub',
    is_major_hub: true,
    stations_included: ['PRYJ', 'PRRB', 'NYN', 'SFG', 'IXD'],
    subtitle: 'Includes Prayagraj Jn (PRYJ), Rambag, Naini, Subedarganj & Bamrauli Airport',
  },
  {
    code: 'BENGALURU',
    name: 'Bengaluru (All Stations & Airports)',
    city: 'Bengaluru',
    country: 'IN',
    type: 'city_hub',
    is_major_hub: true,
    stations_included: ['SBC', 'YPR', 'SMVB', 'BNC', 'BLR'],
    subtitle: 'Includes KSR Bengaluru, Yesvantpur, SMVT & Kempegowda Airport',
  },
  {
    code: 'KOLKATA',
    name: 'Kolkata (All Stations & Airports)',
    city: 'Kolkata',
    country: 'IN',
    type: 'city_hub',
    is_major_hub: true,
    stations_included: ['HWH', 'SDAH', 'KOAA', 'SHM', 'CCU'],
    subtitle: 'Includes Howrah, Sealdah, Kolkata Terminus & NSCB Airport',
  },
  {
    code: 'CHENNAI',
    name: 'Chennai (All Stations & Airports)',
    city: 'Chennai',
    country: 'IN',
    type: 'city_hub',
    is_major_hub: true,
    stations_included: ['MAS', 'MS', 'TBM', 'MAA'],
    subtitle: 'Includes MGR Chennai Central, Egmore, Tambaram & Chennai Airport',
  },
  {
    code: 'PATNA',
    name: 'Patna (All Stations & Airports)',
    city: 'Patna',
    country: 'IN',
    type: 'city_hub',
    is_major_hub: true,
    stations_included: ['PNBE', 'DNR', 'RJPB', 'PAT'],
    subtitle: 'Includes Patna Jn, Danapur, Rajendra Nagar & Jay Prakash Airport',
  },
  {
    code: 'JAIPUR',
    name: 'Jaipur (All Stations & Airports)',
    city: 'Jaipur',
    country: 'IN',
    type: 'city_hub',
    is_major_hub: true,
    stations_included: ['JP', 'GADJ', 'DPA', 'JAI'],
    subtitle: 'Includes Jaipur Jn, Gandhinagar Jaipur & Jaipur Airport',
  },

  // ==========================================
  // RAILWAY STATIONS (Specific Station Codes)
  // ==========================================
  // Mumbai Stations
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Central Railway Trunk Terminal' },
  { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Kurla East · North/Eastbound Expresses' },
  { code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Western Railway Express Terminal' },
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Western Railway Rajdhani/Premier Line' },
  { code: 'PNVL', name: 'Panvel Junction', city: 'Mumbai', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Navi Mumbai · Konkan & Central Gateway' },
  { code: 'DR', name: 'Dadar Central', city: 'Mumbai', country: 'IN', type: 'railway_station', is_major_hub: false, subtitle: 'Central & Western Transfer Junction' },
  { code: 'KYN', name: 'Kalyan Junction', city: 'Mumbai', country: 'IN', type: 'railway_station', is_major_hub: false, subtitle: 'Northeast & Southeast Split Point' },
  { code: 'BVI', name: 'Borivali', city: 'Mumbai', country: 'IN', type: 'railway_station', is_major_hub: false, subtitle: 'Major North-bound suburban halt' },

  // Delhi Stations
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'New Delhi', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Paharganj / Ajmeri Gate Premier Terminal' },
  { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'New Delhi', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'South/Central Rajdhani Terminal' },
  { code: 'DLI', name: 'Old Delhi Railway Station', city: 'New Delhi', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Chandni Chowk Historic Terminal' },
  { code: 'ANVT', name: 'Anand Vihar Terminus', city: 'New Delhi', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'East Delhi Trunk Line Terminal' },

  // Uttar Pradesh & Central Stations
  { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Civil Lines · Major NCR Junction' },
  { code: 'PRRB', name: 'Prayagraj Rambag', city: 'Prayagraj', country: 'IN', type: 'railway_station', is_major_hub: false, subtitle: 'NER Varanasi Line Station' },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Cantonment Main Station' },
  { code: 'BSBS', name: 'Banaras Railway Station', city: 'Varanasi', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Manduadih Modern Terminal' },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction', city: 'Varanasi', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Mughalsarai Grand Trunk Hub' },
  { code: 'ET', name: 'Itarsi Junction', city: 'Itarsi', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'North-South-West National Quad Junction' },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Madhya Pradesh State Capital' },
  { code: 'JBP', name: 'Jabalpur', city: 'Jabalpur', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'West Central Railway HQ' },
  { code: 'KTE', name: 'Katni Junction', city: 'Katni', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Central Mineral & Coal Junction' },
  { code: 'STA', name: 'Satna Junction', city: 'Satna', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Rewa & Chitrakoot Gateway' },
  { code: 'BSL', name: 'Bhusaval Junction', city: 'Bhusaval', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Maharashtra-Madhya Pradesh Gateway' },
  { code: 'KNW', name: 'Khandwa Junction', city: 'Khandwa', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Omkareshwar Gateway' },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Grand Chord Major Hub' },
  { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Awadh Capital Junction' },

  // Eastern & Southern Stations
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Historic 23-platform Megaterminal' },
  { code: 'SDAH', name: 'Sealdah', city: 'Kolkata', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'North Bengal & Suburban Gateway' },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Bihar Capital Hub' },
  { code: 'SBC', name: 'KSR Bengaluru', city: 'Bengaluru', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Majestic City Central Station' },
  { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Northbound Trunk Line Terminal' },
  { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Southern Railway Headquarters' },
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'North Western Railway HQ' },
  { code: 'JAI', name: 'Jaipur Junction', city: 'Jaipur', country: 'IN', type: 'railway_station', is_major_hub: true, subtitle: 'Pink City Central Station' },

  // ==========================================
  // AIRPORTS (IATA Flight Codes)
  // ==========================================
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'IN', type: 'airport', is_major_hub: true, subtitle: 'CSMIA · Terminal 1 & 2' },
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'IN', type: 'airport', is_major_hub: true, subtitle: 'IGI Airport · Terminal 1, 2, 3' },
  { code: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', country: 'IN', type: 'airport', is_major_hub: true, subtitle: 'Babatpur Airport (Varanasi)' },
  { code: 'IXD', name: 'Prayagraj Bamrauli Airport', city: 'Prayagraj', country: 'IN', type: 'airport', is_major_hub: true, subtitle: 'Bamrauli Civil Enclave (Prayagraj)' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'IN', type: 'airport', is_major_hub: true, subtitle: 'Bengaluru Devanahalli T1 & T2' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose Intl Airport', city: 'Kolkata', country: 'IN', type: 'airport', is_major_hub: true, subtitle: 'Dum Dum Airport (Kolkata)' },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'IN', type: 'airport', is_major_hub: true, subtitle: 'Meenambakkam (Chennai)' },
  { code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', country: 'IN', type: 'airport', is_major_hub: true, subtitle: 'Patna Civil Airport' },

  // ==========================================
  // INTERCITY BUS TERMINALS & HUBS
  // ==========================================
  { code: 'BOM_BUS', name: 'Mumbai Borivali / Dadar Bus Terminal', city: 'Mumbai', country: 'IN', type: 'bus_terminal', is_major_hub: false, subtitle: 'Major Intercity Sleeper Stand' },
  { code: 'DEL_BUS', name: 'Delhi ISBT Kashmiri Gate', city: 'New Delhi', country: 'IN', type: 'bus_terminal', is_major_hub: false, subtitle: 'Interstate Bus Terminal (Delhi)' },
  { code: 'BSB_BUS', name: 'Varanasi Cantt Roadways Stand', city: 'Varanasi', country: 'IN', type: 'bus_terminal', is_major_hub: false, subtitle: 'Varanasi Central Bus Stand' },
  { code: 'PRYJ_BUS', name: 'Prayagraj Civil Lines Bus Stand', city: 'Prayagraj', country: 'IN', type: 'bus_terminal', is_major_hub: false, subtitle: 'Prayagraj UPSRTC Terminal' },
];

export function resolveStationDisplayName(codeOrName, mode) {
  if (!codeOrName) return '';
  const upper = codeOrName.trim().toUpperCase();

  const match = MAJOR_STATIONS_CATALOG.find(
    (s) => s.code.toUpperCase() === upper || s.name.toUpperCase().includes(upper)
  );

  if (match) {
    if (match.type === 'airport' || mode === 'FLIGHT') {
      return `${match.name} (${match.code})`;
    }
    if (match.type === 'city_hub') {
      return match.name;
    }
    return `${match.name} (${match.code})`;
  }

  return codeOrName;
}
