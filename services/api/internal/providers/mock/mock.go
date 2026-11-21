package mock

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"tik-tiki/services/api/internal/providers"
	"tik-tiki/services/api/internal/routes"
)

// MockAdapter implements providers.ProviderAdapter with real corridor timetable awareness
type MockAdapter struct{}

func NewMockAdapter() *MockAdapter {
	return &MockAdapter{}
}

func (m *MockAdapter) Code() string {
	return "mock_multimodal"
}

func (m *MockAdapter) Category() providers.Mode {
	return providers.ModeMultimodal
}

var istLocation = time.FixedZone("IST", 5*3600+30*60)

func parseClock(depDate time.Time, timeStr string, addDays int) time.Time {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return depDate.Add(time.Duration(addDays) * 24 * time.Hour)
	}
	hour, _ := strconv.Atoi(parts[0])
	min, _ := strconv.Atoi(parts[1])
	return time.Date(depDate.Year(), depDate.Month(), depDate.Day()+addDays, hour, min, 0, 0, istLocation)
}

func resolveAirport(code string) (airportCode string, airportName string) {
	clean := strings.ToUpper(strings.TrimSpace(code))
	switch clean {
	case "BOM", "MMCT", "CSMT", "LTT", "BDTS", "BVI", "KYN", "MUMBAI", "PNVL", "DR":
		return "BOM", "CSMIA (Mumbai)"
	case "DEL", "NDLS", "NZM", "DLI", "ANVT", "DELHI":
		return "DEL", "IGI Airport (Delhi)"
	case "BSB", "BSBS", "DDU", "VARANASI", "VNS":
		return "VNS", "LBS Airport (Varanasi)"
	case "PRYJ", "PRRB", "NYN", "PRAYAGRAJ", "ALLAHABAD", "IXD":
		return "IXD", "Bamrauli (Prayagraj)"
	case "BLR", "SBC", "YPR", "SMVB", "BNC", "KJM", "BENGALURU", "BANGALORE":
		return "BLR", "Kempegowda Intl (BLR)"
	case "MAS", "MS", "TBM", "AJJ", "CHENNAI", "MAA":
		return "MAA", "Chennai Intl (MAA)"
	case "HWH", "SDAH", "KOAA", "SHM", "KOLKATA", "CCU":
		return "CCU", "NSCB Intl (Kolkata)"
	case "PNBE", "DNR", "RJPB", "PATNA", "PAT":
		return "PAT", "Jay Prakash Intl (Patna)"
	case "JP", "JAI", "JAIPUR":
		return "JAI", "Jaipur Intl Airport"
	default:
		return clean, clean + " Airport"
	}
}

func resolveBusTerminal(code string) string {
	clean := strings.ToUpper(strings.TrimSpace(code))
	switch clean {
	case "BOM", "MMCT", "CSMT", "LTT", "BDTS", "BVI", "KYN", "MUMBAI", "PNVL", "DR":
		return "Mumbai (Borivali / Sion)"
	case "DEL", "NDLS", "NZM", "DLI", "ANVT", "DELHI":
		return "Delhi (ISBT Kashmiri Gate)"
	case "BSB", "BSBS", "DDU", "VARANASI", "VNS":
		return "Varanasi (Cantt Stand)"
	case "PRYJ", "PRRB", "NYN", "PRAYAGRAJ", "ALLAHABAD", "IXD":
		return "Prayagraj (Civil Lines)"
	case "BLR", "SBC", "YPR", "SMVB", "BNC", "KJM", "BENGALURU", "BANGALORE":
		return "Bengaluru (Majestic / Shantinagar)"
	case "MAS", "MS", "TBM", "AJJ", "CHENNAI", "MAA":
		return "Chennai (CMBT Koyambedu)"
	case "HWH", "SDAH", "KOAA", "SHM", "KOLKATA", "CCU":
		return "Kolkata (Esplanade Stand)"
	case "PNBE", "DNR", "RJPB", "PATNA", "PAT":
		return "Patna (Bairiya ISBT)"
	case "JP", "JAI", "JAIPUR":
		return "Jaipur (Sindhi Camp)"
	default:
		return clean + " Bus Station"
	}
}

func (m *MockAdapter) Search(ctx context.Context, query providers.SearchQuery) ([]providers.NormalizedOffer, error) {
	depDate := query.DepartureDate
	if depDate.IsZero() {
		depDate = time.Now().Add(24 * time.Hour)
	}

	var offers []providers.NormalizedOffer

	// 1. Query real corridor trains between the requested origin and destination
	matchingTrains := routes.FindAllTrainsBetweenStations(query.OriginCode, query.DestCode)

	for idx, train := range matchingTrains {
		var originStop, destStop *routes.TrainStop
		for i := range train.Stops {
			stopCode := strings.ToUpper(train.Stops[i].StationCode)
			if routes.StationMatchesGroup(stopCode, query.OriginCode) {
				if originStop == nil {
					originStop = &train.Stops[i]
				}
			}
			if routes.StationMatchesGroup(stopCode, query.DestCode) {
				destStop = &train.Stops[i]
			}
		}

		if originStop != nil && destStop != nil && originStop.SequenceNumber < destStop.SequenceNumber {
			// Calculate real departure and arrival times in Indian Standard Time (IST)
			tDepart := parseClock(depDate, originStop.ScheduledDepart, 0)
			
			// Arrival is initially parsed on the same day
			tArrive := parseClock(depDate, destStop.ScheduledArrive, 0)
			
			// If arrival clock is earlier than departure clock, the train journey crosses midnight
			for tArrive.Before(tDepart) {
				tArrive = tArrive.Add(24 * time.Hour)
			}
			
			durationMins := int(tArrive.Sub(tDepart).Minutes())
			
			// Sanity check: if implied average speed would exceed 120 km/h for a multi-day journey,
			// it crossed an additional midnight boundary
			distKm := destStop.DistanceKm - originStop.DistanceKm
			if distKm > 0 && durationMins < (distKm*60/120) {
				tArrive = tArrive.Add(24 * time.Hour)
				durationMins = int(tArrive.Sub(tDepart).Minutes())
			}
			if durationMins <= 0 {
				durationMins = (destStop.DistanceKm - originStop.DistanceKm) * 60 / 75 // approx speed
				if durationMins <= 0 {
					durationMins = 360
				}
			}

			// Alternate status for testing
			status := "AVAILABLE"
			availSeats := 8 + (idx * 3)
			if idx%3 == 2 {
				status = "WAITLIST"
				availSeats = 0
			}

			var stopInfos []providers.RouteStopInfo
			for _, s := range train.Stops {
				stopInfos = append(stopInfos, providers.RouteStopInfo{
					StationCode:     s.StationCode,
					StationName:     s.StationName,
					ScheduledArrive: s.ScheduledArrive,
					ScheduledDepart: s.ScheduledDepart,
					DistanceKm:      s.DistanceKm,
					HaltMinutes:     s.HaltMinutes,
					PlatformNumber:  s.PlatformNumber,
				})
			}

			depPlat := fmt.Sprintf("Platform %d", train.DeparturePlatform)
			if originStop.PlatformNumber > 0 {
				depPlat = fmt.Sprintf("Platform %d", originStop.PlatformNumber)
			}
			arrPlat := fmt.Sprintf("Platform %d", train.ArrivalPlatform)
			if destStop.PlatformNumber > 0 {
				arrPlat = fmt.Sprintf("Platform %d", destStop.PlatformNumber)
			}

			days := train.DaysOfRun
			if len(days) == 0 {
				days = []string{"MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"}
			}
			punct := train.PunctualityRating
			if punct == 0 {
				punct = 88
			}

			base3A := train.BaseFare3A
			if base3A <= 0 {
				base3A = 1580.0
			}
			var classes []providers.ClassOption
			switch train.TrainType {
			case "VANDE_BHARAT", "SHATABDI":
				classes = []providers.ClassOption{
					{Code: "CC", Name: "AC Chair Car", Fare: base3A, Status: status, Seats: availSeats},
					{Code: "EC", Name: "Exec Chair Car", Fare: base3A * 1.85, Status: "AVAILABLE", Seats: 4},
				}
			case "RAJDHANI":
				classes = []providers.ClassOption{
					{Code: "3A", Name: "AC 3 Tier", Fare: base3A, Status: status, Seats: availSeats},
					{Code: "2A", Name: "AC 2 Tier", Fare: base3A * 1.35, Status: "AVAILABLE", Seats: 6},
					{Code: "1A", Name: "AC First Class", Fare: base3A * 1.8, Status: "AVAILABLE", Seats: 2},
				}
			case "GARIB_RATH":
				classes = []providers.ClassOption{
					{Code: "3E", Name: "AC 3 Economy", Fare: base3A * 0.75, Status: status, Seats: availSeats},
					{Code: "CC", Name: "AC Chair Car", Fare: base3A * 0.90, Status: "AVAILABLE", Seats: 12},
				}
			default:
				classes = []providers.ClassOption{
					{Code: "3A", Name: "AC 3 Tier", Fare: base3A, Status: status, Seats: availSeats},
					{Code: "2A", Name: "AC 2 Tier", Fare: base3A * 1.35, Status: "AVAILABLE", Seats: 6},
					{Code: "1A", Name: "AC First Class", Fare: base3A * 1.8, Status: "AVAILABLE", Seats: 2},
					{Code: "SL", Name: "Sleeper Class", Fare: base3A * 0.42, Status: "WAITLIST", Seats: 18},
				}
			}

			offer := providers.NormalizedOffer{
				ProviderID:        "irctc_cris",
				Mode:              providers.ModeRail,
				OperatorName:      "Indian Railways",
				ServiceNumber:     fmt.Sprintf("%s (%s)", train.TrainNumber, train.TrainName),
				OriginCode:        originStop.StationCode,
				DestCode:          destStop.StationCode,
				DepartureAt:       tDepart,
				ArrivalAt:         tArrive,
				DurationMinutes:   durationMins,
				Price:             train.BaseFare3A,
				Currency:          "INR",
				Transfers:         0,
				Status:            status,
				AvailableSeats:    availSeats,
				BookingURL:        fmt.Sprintf("https://www.irctc.co.in/nget/train-search?train=%s", train.TrainNumber),
				RetrievedAt:       time.Now().UTC(),
				DaysOfRun:         days,
				PantryAvailable:   train.PantryAvailable,
				PunctualityRating: punct,
				DeparturePlatform: depPlat,
				ArrivalPlatform:   arrPlat,
				Stops:             stopInfos,
				Classes:           classes,
			}
			offers = append(offers, offer)
		}
	}

	// 2. Real Multi-Modal Air Travel Options (Real Airport Codes & Realistic Fares)
	origAirCode, origAirName := resolveAirport(query.OriginCode)
	destAirCode, destAirName := resolveAirport(query.DestCode)

	offers = append(offers, providers.NormalizedOffer{
		ProviderID:        "duffel_flight",
		Mode:              providers.ModeFlight,
		OperatorName:      "IndiGo (6E-6512)",
		ServiceNumber:     "6E-6512",
		OriginCode:        origAirCode,
		DestCode:          destAirCode,
		DepartureAt:       parseClock(depDate, "08:30", 0),
		ArrivalAt:         parseClock(depDate, "10:45", 0),
		DurationMinutes:   135,
		Price:             4890.00,
		Currency:          "INR",
		Transfers:         0,
		Status:            "AVAILABLE",
		AvailableSeats:    14,
		BookingURL:        "https://www.goindigo.in",
		RetrievedAt:       time.Now().UTC(),
		PunctualityRating: 94,
		DeparturePlatform: fmt.Sprintf("Terminal 2 · %s", origAirName),
		ArrivalPlatform:   fmt.Sprintf("Terminal 1 · %s", destAirName),
	})

	offers = append(offers, providers.NormalizedOffer{
		ProviderID:        "duffel_flight",
		Mode:              providers.ModeFlight,
		OperatorName:      "Air India (AI-864)",
		ServiceNumber:     "AI-864",
		OriginCode:        origAirCode,
		DestCode:          destAirCode,
		DepartureAt:       parseClock(depDate, "14:15", 0),
		ArrivalAt:         parseClock(depDate, "16:35", 0),
		DurationMinutes:   140,
		Price:             5420.00,
		Currency:          "INR",
		Transfers:         0,
		Status:            "AVAILABLE",
		AvailableSeats:    8,
		BookingURL:        "https://www.airindia.com",
		RetrievedAt:       time.Now().UTC(),
		PunctualityRating: 91,
		DeparturePlatform: fmt.Sprintf("Terminal 2 · %s", origAirName),
		ArrivalPlatform:   fmt.Sprintf("Terminal 1 · %s", destAirName),
	})

	offers = append(offers, providers.NormalizedOffer{
		ProviderID:        "duffel_flight",
		Mode:              providers.ModeFlight,
		OperatorName:      "Akasa Air (QP-1392)",
		ServiceNumber:     "QP-1392",
		OriginCode:        origAirCode,
		DestCode:          destAirCode,
		DepartureAt:       parseClock(depDate, "18:45", 0),
		ArrivalAt:         parseClock(depDate, "21:05", 0),
		DurationMinutes:   140,
		Price:             4450.00,
		Currency:          "INR",
		Transfers:         0,
		Status:            "AVAILABLE",
		AvailableSeats:    16,
		BookingURL:        "https://www.akasaair.com",
		RetrievedAt:       time.Now().UTC(),
		PunctualityRating: 95,
		DeparturePlatform: fmt.Sprintf("Terminal 1 · %s", origAirName),
		ArrivalPlatform:   fmt.Sprintf("Terminal 2 · %s", destAirName),
	})

	// 3. Real Premium Intercity Buses (Real Boarding Terminals & Authentic Sleeper Coaches)
	origBusTerm := resolveBusTerminal(query.OriginCode)
	destBusTerm := resolveBusTerminal(query.DestCode)

	offers = append(offers, providers.NormalizedOffer{
		ProviderID:        "redbus_partner",
		Mode:              providers.ModeBus,
		OperatorName:      "Zingbus Plus Electric AC Sleeper",
		ServiceNumber:     "ZB-9921",
		OriginCode:        origBusTerm,
		DestCode:          destBusTerm,
		DepartureAt:       parseClock(depDate, "20:30", 0),
		ArrivalAt:         parseClock(depDate, "14:00", 1),
		DurationMinutes:   1050,
		Price:             1420.00,
		Currency:          "INR",
		Transfers:         0,
		Status:            "AVAILABLE",
		AvailableSeats:    18,
		BookingURL:        "https://www.redbus.in",
		RetrievedAt:       time.Now().UTC(),
		PunctualityRating: 88,
		DeparturePlatform: "Boarding: Platform 3",
		ArrivalPlatform:   "Dropping: Main Terminal",
	})

	offers = append(offers, providers.NormalizedOffer{
		ProviderID:        "redbus_partner",
		Mode:              providers.ModeBus,
		OperatorName:      "IntrCity SmartBus Multi-Axle Volvo",
		ServiceNumber:     "IC-4402",
		OriginCode:        origBusTerm,
		DestCode:          destBusTerm,
		DepartureAt:       parseClock(depDate, "18:00", 0),
		ArrivalAt:         parseClock(depDate, "11:30", 1),
		DurationMinutes:   1050,
		Price:             1680.00,
		Currency:          "INR",
		Transfers:         0,
		Status:            "AVAILABLE",
		AvailableSeats:    12,
		BookingURL:        "https://www.intrcity.com",
		RetrievedAt:       time.Now().UTC(),
		PunctualityRating: 93,
		DeparturePlatform: "Boarding: Lounge Gate 1",
		ArrivalPlatform:   "Dropping: Central Stand",
	})

	offers = append(offers, providers.NormalizedOffer{
		ProviderID:        "redbus_partner",
		Mode:              providers.ModeBus,
		OperatorName:      "NueGo Electric AC Semi-Sleeper",
		ServiceNumber:     "NG-7810",
		OriginCode:        origBusTerm,
		DestCode:          destBusTerm,
		DepartureAt:       parseClock(depDate, "21:45", 0),
		ArrivalAt:         parseClock(depDate, "15:15", 1),
		DurationMinutes:   1050,
		Price:             1350.00,
		Currency:          "INR",
		Transfers:         0,
		Status:            "AVAILABLE",
		AvailableSeats:    22,
		BookingURL:        "https://www.nuego.in",
		RetrievedAt:       time.Now().UTC(),
		PunctualityRating: 96,
		DeparturePlatform: "Boarding: EV Hub Gate A",
		ArrivalPlatform:   "Dropping: City Bypass Terminal",
	})

	// Filter by requested modes if specified
	if len(query.Modes) > 0 {
		var filtered []providers.NormalizedOffer
		for _, o := range offers {
			for _, m := range query.Modes {
				if o.Mode == m || strings.EqualFold(string(o.Mode), string(m)) {
					filtered = append(filtered, o)
					break
				}
			}
		}
		return filtered, nil
	}

	return offers, nil
}

func (m *MockAdapter) CheckAvailability(ctx context.Context, serviceNo string, date time.Time, travelClass string) (string, int, error) {
	return "AVAILABLE", 6, nil
}
