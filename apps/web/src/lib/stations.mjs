export const MAJOR_STATIONS_CATALOG = [
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'New Delhi', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', city: 'Mumbai', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'ET', name: 'Itarsi Junction', city: 'Itarsi', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'BSL', name: 'Bhusaval Junction', city: 'Bhusaval', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'KNW', name: 'Khandwa Junction', city: 'Khandwa', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'JAI', name: 'Jaipur Junction', city: 'Jaipur', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'BLR', name: 'KSR Bengaluru', city: 'Bengaluru', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'MAS', name: 'Chennai Central', city: 'Chennai', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'GKP', name: 'Gorakhpur Junction', city: 'Gorakhpur', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'JBP', name: 'Jabalpur', city: 'Jabalpur', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'KTE', name: 'Katni Junction', city: 'Katni', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'STA', name: 'Satna Junction', city: 'Satna', country: 'IN', type: 'railway_station', is_major_hub: true },
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'IN', type: 'airport', is_major_hub: true },
];

export function resolveStationDisplayName(codeOrName) {
  if (!codeOrName) return '';
  const upper = codeOrName.trim().toUpperCase();
  const match = MAJOR_STATIONS_CATALOG.find(
    (s) => s.code.toUpperCase() === upper || s.name.toUpperCase().includes(upper)
  );
  if (match) {
    return `${match.name} (${match.code})`;
  }
  return codeOrName;
}
