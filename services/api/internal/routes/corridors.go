package routes

import (
	"strings"
)

// RealCorridorTrain represents a real Indian Railways service operating on a corridor
type RealCorridorTrain struct {
	TrainNumber   string      `json:"train_number"`
	TrainName     string      `json:"train_name"`
	TrainType     string      `json:"train_type"` // RAJDHANI, SUPERFAST, MAIL, EXPRESS, GARIB_RATH
	SourceCode    string      `json:"source_code"`
	DestCode      string      `json:"dest_code"`
	BaseFare3A    float64     `json:"base_fare_3a"`
	Stops         []TrainStop `json:"stops"`
}

// MasterCorridors holds real timetables for India's major trunk lines
var MasterCorridors = []RealCorridorTrain{
	// ==========================================
	// 1. WESTERN TRUNK: Mumbai Central <-> New Delhi
	// ==========================================
	{
		TrainNumber: "12951",
		TrainName:   "Tejas Rajdhani Express",
		TrainType:   "RAJDHANI",
		SourceCode:  "MMCT",
		DestCode:    "NDLS",
		BaseFare3A:  2850.00,
		Stops: []TrainStop{
			{TrainNumber: "12951", StationCode: "MMCT", StationName: "Mumbai Central", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "17:00"},
			{TrainNumber: "12951", StationCode: "BVI", StationName: "Borivali", SequenceNumber: 2, DistanceKm: 30, ScheduledArrive: "17:22", ScheduledDepart: "17:24"},
			{TrainNumber: "12951", StationCode: "ST", StationName: "Surat", SequenceNumber: 3, DistanceKm: 263, ScheduledArrive: "19:43", ScheduledDepart: "19:48"},
			{TrainNumber: "12951", StationCode: "BRC", StationName: "Vadodara Junction", SequenceNumber: 4, DistanceKm: 393, ScheduledArrive: "21:06", ScheduledDepart: "21:16"},
			{TrainNumber: "12951", StationCode: "RTM", StationName: "Ratlam Junction", SequenceNumber: 5, DistanceKm: 653, ScheduledArrive: "00:25", ScheduledDepart: "00:28"},
			{TrainNumber: "12951", StationCode: "KOTA", StationName: "Kota Junction", SequenceNumber: 6, DistanceKm: 920, ScheduledArrive: "03:15", ScheduledDepart: "03:20"},
			{TrainNumber: "12951", StationCode: "NDLS", StationName: "New Delhi Railway Station", SequenceNumber: 7, DistanceKm: 1386, ScheduledArrive: "08:32"},
		},
	},
	{
		TrainNumber: "12953",
		TrainName:   "August Kranti Tejas Rajdhani",
		TrainType:   "RAJDHANI",
		SourceCode:  "MMCT",
		DestCode:    "NDLS",
		BaseFare3A:  2780.00,
		Stops: []TrainStop{
			{TrainNumber: "12953", StationCode: "MMCT", StationName: "Mumbai Central", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "17:10"},
			{TrainNumber: "12953", StationCode: "BVI", StationName: "Borivali", SequenceNumber: 2, DistanceKm: 30, ScheduledArrive: "17:33", ScheduledDepart: "17:35"},
			{TrainNumber: "12953", StationCode: "ST", StationName: "Surat", SequenceNumber: 3, DistanceKm: 263, ScheduledArrive: "19:50", ScheduledDepart: "19:55"},
			{TrainNumber: "12953", StationCode: "BRC", StationName: "Vadodara Junction", SequenceNumber: 4, DistanceKm: 393, ScheduledArrive: "21:14", ScheduledDepart: "21:24"},
			{TrainNumber: "12953", StationCode: "RTM", StationName: "Ratlam Junction", SequenceNumber: 5, DistanceKm: 653, ScheduledArrive: "00:45", ScheduledDepart: "00:48"},
			{TrainNumber: "12953", StationCode: "KOTA", StationName: "Kota Junction", SequenceNumber: 6, DistanceKm: 920, ScheduledArrive: "04:05", ScheduledDepart: "04:15"},
			{TrainNumber: "12953", StationCode: "MTJ", StationName: "Mathura Junction", SequenceNumber: 7, DistanceKm: 1244, ScheduledArrive: "07:53", ScheduledDepart: "07:55"},
			{TrainNumber: "12953", StationCode: "NZM", StationName: "Hazrat Nizamuddin", SequenceNumber: 8, DistanceKm: 1378, ScheduledArrive: "09:43", ScheduledDepart: "09:45"},
			{TrainNumber: "12953", StationCode: "NDLS", StationName: "New Delhi Railway Station", SequenceNumber: 9, DistanceKm: 1386, ScheduledArrive: "10:55"},
		},
	},
	{
		TrainNumber: "12925",
		TrainName:   "Paschim Superfast Express",
		TrainType:   "SUPERFAST",
		SourceCode:  "MMCT",
		DestCode:    "NDLS",
		BaseFare3A:  1690.00,
		Stops: []TrainStop{
			{TrainNumber: "12925", StationCode: "MMCT", StationName: "Mumbai Central", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "11:25"},
			{TrainNumber: "12925", StationCode: "BVI", StationName: "Borivali", SequenceNumber: 2, DistanceKm: 30, ScheduledArrive: "11:55", ScheduledDepart: "11:58"},
			{TrainNumber: "12925", StationCode: "ST", StationName: "Surat", SequenceNumber: 3, DistanceKm: 263, ScheduledArrive: "15:47", ScheduledDepart: "15:52"},
			{TrainNumber: "12925", StationCode: "BRC", StationName: "Vadodara Junction", SequenceNumber: 4, DistanceKm: 393, ScheduledArrive: "17:37", ScheduledDepart: "17:47"},
			{TrainNumber: "12925", StationCode: "RTM", StationName: "Ratlam Junction", SequenceNumber: 5, DistanceKm: 653, ScheduledArrive: "21:40", ScheduledDepart: "21:50"},
			{TrainNumber: "12925", StationCode: "KOTA", StationName: "Kota Junction", SequenceNumber: 6, DistanceKm: 920, ScheduledArrive: "01:50", ScheduledDepart: "02:00"},
			{TrainNumber: "12925", StationCode: "MTJ", StationName: "Mathura Junction", SequenceNumber: 7, DistanceKm: 1244, ScheduledArrive: "06:55", ScheduledDepart: "07:00"},
			{TrainNumber: "12925", StationCode: "NDLS", StationName: "New Delhi Railway Station", SequenceNumber: 8, DistanceKm: 1386, ScheduledArrive: "11:05"},
		},
	},
	{
		TrainNumber: "12903",
		TrainName:   "Golden Temple Mail",
		TrainType:   "SUPERFAST",
		SourceCode:  "MMCT",
		DestCode:    "NDLS",
		BaseFare3A:  1640.00,
		Stops: []TrainStop{
			{TrainNumber: "12903", StationCode: "MMCT", StationName: "Mumbai Central", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "18:45"},
			{TrainNumber: "12903", StationCode: "BVI", StationName: "Borivali", SequenceNumber: 2, DistanceKm: 30, ScheduledArrive: "19:15", ScheduledDepart: "19:18"},
			{TrainNumber: "12903", StationCode: "ST", StationName: "Surat", SequenceNumber: 3, DistanceKm: 263, ScheduledArrive: "23:05", ScheduledDepart: "23:10"},
			{TrainNumber: "12903", StationCode: "BRC", StationName: "Vadodara Junction", SequenceNumber: 4, DistanceKm: 393, ScheduledArrive: "00:45", ScheduledDepart: "00:55"},
			{TrainNumber: "12903", StationCode: "RTM", StationName: "Ratlam Junction", SequenceNumber: 5, DistanceKm: 653, ScheduledArrive: "05:00", ScheduledDepart: "05:10"},
			{TrainNumber: "12903", StationCode: "KOTA", StationName: "Kota Junction", SequenceNumber: 6, DistanceKm: 920, ScheduledArrive: "09:05", ScheduledDepart: "09:15"},
			{TrainNumber: "12903", StationCode: "NZM", StationName: "Hazrat Nizamuddin", SequenceNumber: 7, DistanceKm: 1378, ScheduledArrive: "13:50"},
			{TrainNumber: "12903", StationCode: "NDLS", StationName: "New Delhi Railway Station", SequenceNumber: 8, DistanceKm: 1386, ScheduledArrive: "14:15"},
		},
	},
	{
		TrainNumber: "12909",
		TrainName:   "Bandra Terminus - NZM Garib Rath",
		TrainType:   "GARIB_RATH",
		SourceCode:  "MMCT",
		DestCode:    "NDLS",
		BaseFare3A:  1050.00,
		Stops: []TrainStop{
			{TrainNumber: "12909", StationCode: "MMCT", StationName: "Mumbai Central (BDTS)", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "17:30"},
			{TrainNumber: "12909", StationCode: "BVI", StationName: "Borivali", SequenceNumber: 2, DistanceKm: 19, ScheduledArrive: "17:55", ScheduledDepart: "17:59"},
			{TrainNumber: "12909", StationCode: "ST", StationName: "Surat", SequenceNumber: 3, DistanceKm: 252, ScheduledArrive: "21:07", ScheduledDepart: "21:10"},
			{TrainNumber: "12909", StationCode: "BRC", StationName: "Vadodara Junction", SequenceNumber: 4, DistanceKm: 382, ScheduledArrive: "22:30", ScheduledDepart: "22:40"},
			{TrainNumber: "12909", StationCode: "RTM", StationName: "Ratlam Junction", SequenceNumber: 5, DistanceKm: 642, ScheduledArrive: "02:15", ScheduledDepart: "02:20"},
			{TrainNumber: "12909", StationCode: "KOTA", StationName: "Kota Junction", SequenceNumber: 6, DistanceKm: 909, ScheduledArrive: "05:25", ScheduledDepart: "05:30"},
			{TrainNumber: "12909", StationCode: "NZM", StationName: "Hazrat Nizamuddin", SequenceNumber: 7, DistanceKm: 1367, ScheduledArrive: "09:40"},
			{TrainNumber: "12909", StationCode: "NDLS", StationName: "New Delhi Railway Station", SequenceNumber: 8, DistanceKm: 1375, ScheduledArrive: "10:10"},
		},
	},

	// ==========================================
	// 2. WESTERN / RAJASTHAN: Mumbai <-> Jaipur
	// ==========================================
	{
		TrainNumber: "12955",
		TrainName:   "Mumbai Central - Jaipur Superfast",
		TrainType:   "SUPERFAST",
		SourceCode:  "MMCT",
		DestCode:    "JP",
		BaseFare3A:  1640.00,
		Stops: []TrainStop{
			{TrainNumber: "12955", StationCode: "MMCT", StationName: "Mumbai Central", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "19:05"},
			{TrainNumber: "12955", StationCode: "BOM", StationName: "Mumbai Central", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "19:05"},
			{TrainNumber: "12955", StationCode: "BVI", StationName: "Borivali", SequenceNumber: 2, DistanceKm: 30, ScheduledArrive: "19:32", ScheduledDepart: "19:34"},
			{TrainNumber: "12955", StationCode: "ST", StationName: "Surat", SequenceNumber: 3, DistanceKm: 263, ScheduledArrive: "22:30", ScheduledDepart: "22:35"},
			{TrainNumber: "12955", StationCode: "BRC", StationName: "Vadodara Junction", SequenceNumber: 4, DistanceKm: 393, ScheduledArrive: "00:08", ScheduledDepart: "00:18"},
			{TrainNumber: "12955", StationCode: "RTM", StationName: "Ratlam Junction", SequenceNumber: 5, DistanceKm: 653, ScheduledArrive: "04:05", ScheduledDepart: "04:15"},
			{TrainNumber: "12955", StationCode: "KOTA", StationName: "Kota Junction", SequenceNumber: 6, DistanceKm: 920, ScheduledArrive: "07:45", ScheduledDepart: "07:55"},
			{TrainNumber: "12955", StationCode: "SWM", StationName: "Sawai Madhopur", SequenceNumber: 7, DistanceKm: 1028, ScheduledArrive: "09:25", ScheduledDepart: "09:40"},
			{TrainNumber: "12955", StationCode: "JP", StationName: "Jaipur Junction", SequenceNumber: 8, DistanceKm: 1160, ScheduledArrive: "12:45"},
			{TrainNumber: "12955", StationCode: "JAI", StationName: "Jaipur Junction", SequenceNumber: 8, DistanceKm: 1160, ScheduledArrive: "12:45"},
		},
	},
	{
		TrainNumber: "12979",
		TrainName:   "Bandra Terminus - Jaipur Superfast",
		TrainType:   "SUPERFAST",
		SourceCode:  "MMCT",
		DestCode:    "JP",
		BaseFare3A:  1640.00,
		Stops: []TrainStop{
			{TrainNumber: "12979", StationCode: "MMCT", StationName: "Mumbai Central", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "17:05"},
			{TrainNumber: "12979", StationCode: "BOM", StationName: "Mumbai Central", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "17:05"},
			{TrainNumber: "12979", StationCode: "BVI", StationName: "Borivali", SequenceNumber: 2, DistanceKm: 19, ScheduledArrive: "17:37", ScheduledDepart: "17:40"},
			{TrainNumber: "12979", StationCode: "ST", StationName: "Surat", SequenceNumber: 3, DistanceKm: 252, ScheduledArrive: "20:55", ScheduledDepart: "21:00"},
			{TrainNumber: "12979", StationCode: "BRC", StationName: "Vadodara Junction", SequenceNumber: 4, DistanceKm: 382, ScheduledArrive: "22:28", ScheduledDepart: "22:38"},
			{TrainNumber: "12979", StationCode: "KOTA", StationName: "Kota Junction", SequenceNumber: 5, DistanceKm: 909, ScheduledArrive: "06:15", ScheduledDepart: "06:25"},
			{TrainNumber: "12979", StationCode: "JP", StationName: "Jaipur Junction", SequenceNumber: 6, DistanceKm: 1148, ScheduledArrive: "10:20"},
			{TrainNumber: "12979", StationCode: "JAI", StationName: "Jaipur Junction", SequenceNumber: 6, DistanceKm: 1148, ScheduledArrive: "10:20"},
		},
	},

	// ==========================================
	// 2. CENTRAL / NORTHERN TRUNK: Mumbai <-> Itarsi <-> Prayagraj
	// ==========================================
	{
		TrainNumber: "11059",
		TrainName:   "Godan Express",
		TrainType:   "EXPRESS",
		SourceCode:  "LTT",
		DestCode:    "PRYJ",
		BaseFare3A:  1420.00,
		Stops: []TrainStop{
			{TrainNumber: "11059", StationCode: "LTT", StationName: "Lokmanya Tilak Terminus", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "10:55"},
			{TrainNumber: "11059", StationCode: "BOM", StationName: "Chhatrapati Shivaji Maharaj Terminus", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "10:30"},
			{TrainNumber: "11059", StationCode: "KYN", StationName: "Kalyan Junction", SequenceNumber: 2, DistanceKm: 55, ScheduledArrive: "11:38", ScheduledDepart: "11:40"},
			{TrainNumber: "11059", StationCode: "NK", StationName: "Nashik Road", SequenceNumber: 3, DistanceKm: 187, ScheduledArrive: "14:20", ScheduledDepart: "14:25"},
			{TrainNumber: "11059", StationCode: "MMR", StationName: "Manmad Junction", SequenceNumber: 4, DistanceKm: 260, ScheduledArrive: "15:20", ScheduledDepart: "15:25"},
			{TrainNumber: "11059", StationCode: "BSL", StationName: "Bhusaval Junction", SequenceNumber: 5, DistanceKm: 444, ScheduledArrive: "18:05", ScheduledDepart: "18:10"},
			{TrainNumber: "11059", StationCode: "KNW", StationName: "Khandwa Junction", SequenceNumber: 6, DistanceKm: 568, ScheduledArrive: "20:32", ScheduledDepart: "20:35"},
			{TrainNumber: "11059", StationCode: "ET", StationName: "Itarsi Junction", SequenceNumber: 7, DistanceKm: 751, ScheduledArrive: "23:05", ScheduledDepart: "23:15"},
			{TrainNumber: "11059", StationCode: "JBP", StationName: "Jabalpur", SequenceNumber: 8, DistanceKm: 996, ScheduledArrive: "02:40", ScheduledDepart: "02:50"},
			{TrainNumber: "11059", StationCode: "KTE", StationName: "Katni Junction", SequenceNumber: 9, DistanceKm: 1087, ScheduledArrive: "04:10", ScheduledDepart: "04:15"},
			{TrainNumber: "11059", StationCode: "STA", StationName: "Satna Junction", SequenceNumber: 10, DistanceKm: 1185, ScheduledArrive: "05:40", ScheduledDepart: "05:45"},
			{TrainNumber: "11059", StationCode: "PRYJ", StationName: "Prayagraj Junction", SequenceNumber: 11, DistanceKm: 1362, ScheduledArrive: "11:55"},
		},
	},
	{
		TrainNumber: "12167",
		TrainName:   "Banaras Superfast Express",
		TrainType:   "SUPERFAST",
		SourceCode:  "LTT",
		DestCode:    "PRYJ",
		BaseFare3A:  1530.00,
		Stops: []TrainStop{
			{TrainNumber: "12167", StationCode: "LTT", StationName: "Lokmanya Tilak Terminus", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "22:45"},
			{TrainNumber: "12167", StationCode: "BOM", StationName: "Chhatrapati Shivaji Maharaj Terminus", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "22:15"},
			{TrainNumber: "12167", StationCode: "KYN", StationName: "Kalyan Junction", SequenceNumber: 2, DistanceKm: 55, ScheduledArrive: "23:27", ScheduledDepart: "23:30"},
			{TrainNumber: "12167", StationCode: "BSL", StationName: "Bhusaval Junction", SequenceNumber: 3, DistanceKm: 444, ScheduledArrive: "05:35", ScheduledDepart: "05:40"},
			{TrainNumber: "12167", StationCode: "KNW", StationName: "Khandwa Junction", SequenceNumber: 4, DistanceKm: 568, ScheduledArrive: "07:55", ScheduledDepart: "07:58"},
			{TrainNumber: "12167", StationCode: "ET", StationName: "Itarsi Junction", SequenceNumber: 5, DistanceKm: 751, ScheduledArrive: "10:15", ScheduledDepart: "10:25"},
			{TrainNumber: "12167", StationCode: "JBP", StationName: "Jabalpur", SequenceNumber: 6, DistanceKm: 996, ScheduledArrive: "13:40", ScheduledDepart: "13:50"},
			{TrainNumber: "12167", StationCode: "PRYJ", StationName: "Prayagraj Junction", SequenceNumber: 7, DistanceKm: 1362, ScheduledArrive: "19:15"},
		},
	},
	{
		TrainNumber: "12293",
		TrainName:   "LTT - Prayagraj Duronto Express",
		TrainType:   "RAJDHANI",
		SourceCode:  "LTT",
		DestCode:    "PRYJ",
		BaseFare3A:  2100.00,
		Stops: []TrainStop{
			{TrainNumber: "12293", StationCode: "LTT", StationName: "Lokmanya Tilak Terminus", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "17:25"},
			{TrainNumber: "12293", StationCode: "BOM", StationName: "Chhatrapati Shivaji Maharaj Terminus", SequenceNumber: 1, DistanceKm: 0, ScheduledDepart: "17:00"},
			{TrainNumber: "12293", StationCode: "BSL", StationName: "Bhusaval Junction", SequenceNumber: 2, DistanceKm: 444, ScheduledArrive: "23:45", ScheduledDepart: "23:50"},
			{TrainNumber: "12293", StationCode: "ET", StationName: "Itarsi Junction", SequenceNumber: 3, DistanceKm: 751, ScheduledArrive: "03:45", ScheduledDepart: "03:55"},
			{TrainNumber: "12293", StationCode: "JBP", StationName: "Jabalpur", SequenceNumber: 4, DistanceKm: 996, ScheduledArrive: "07:05", ScheduledDepart: "07:15"},
			{TrainNumber: "12293", StationCode: "PRYJ", StationName: "Prayagraj Junction", SequenceNumber: 5, DistanceKm: 1362, ScheduledArrive: "12:40"},
		},
	},
}

// FindAllTrainsBetweenStations searches all corridor databases for trains stopping at both stations in order
func FindAllTrainsBetweenStations(originCode, destCode string) []RealCorridorTrain {
	originUpper := strings.ToUpper(strings.TrimSpace(originCode))
	destUpper := strings.ToUpper(strings.TrimSpace(destCode))

	// Normalize BOM / CSMT / MMCT aliases
	if originUpper == "BOM" {
		originUpper = "MMCT"
	}
	if destUpper == "BOM" {
		destUpper = "MMCT"
	}

	var matches []RealCorridorTrain

	for _, train := range MasterCorridors {
		originIdx := -1
		destIdx := -1

		for i, stop := range train.Stops {
			stopUpper := strings.ToUpper(stop.StationCode)
			if stopUpper == originUpper || (originCode == "BOM" && (stopUpper == "BOM" || stopUpper == "LTT" || stopUpper == "MMCT")) {
				if originIdx == -1 {
					originIdx = i
				}
			}
			if stopUpper == destUpper || (destCode == "BOM" && (stopUpper == "BOM" || stopUpper == "LTT" || stopUpper == "MMCT")) {
				destIdx = i
			}
		}

		if originIdx != -1 && destIdx != -1 && originIdx < destIdx {
			matches = append(matches, train)
		}
	}

	return matches
}

// GetRouteStopsForTrain returns the full ordered stop sequence for any corridor train
func GetRouteStopsForTrain(trainNumber string) []TrainStop {
	for _, train := range MasterCorridors {
		if train.TrainNumber == trainNumber {
			return train.Stops
		}
	}
	return nil
}
