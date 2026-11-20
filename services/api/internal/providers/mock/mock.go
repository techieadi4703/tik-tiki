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

func parseClock(depDate time.Time, timeStr string, addDays int) time.Time {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return depDate.Add(time.Duration(addDays) * 24 * time.Hour)
	}
	hour, _ := strconv.Atoi(parts[0])
	min, _ := strconv.Atoi(parts[1])
	return time.Date(depDate.Year(), depDate.Month(), depDate.Day()+addDays, hour, min, 0, 0, time.UTC)
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
			// Calculate real departure and arrival times
			tDepart := parseClock(depDate, originStop.ScheduledDepart, 0)
			dayOffset := 0
			if destStop.DistanceKm-originStop.DistanceKm > 600 {
				dayOffset = 1
			}
			tArrive := parseClock(depDate, destStop.ScheduledArrive, dayOffset)
			if tArrive.Before(tDepart) {
				tArrive = tArrive.Add(24 * time.Hour)
			}
			durationMins := int(tArrive.Sub(tDepart).Minutes())
			if durationMins <= 0 {
				durationMins = (destStop.DistanceKm - originStop.DistanceKm) * 60 / 75 // approx speed
				if durationMins <= 0 {
					durationMins = 360
				}
			}

			// Alternate status for testing
			status := "AVAILABLE"
			availSeats := 8 + (idx * 3)
			if idx%2 == 1 {
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
			classes := []providers.ClassOption{
				{Code: "3A", Name: "AC 3 Tier", Fare: base3A, Status: status, Seats: availSeats},
				{Code: "2A", Name: "AC 2 Tier", Fare: base3A * 1.35, Status: "AVAILABLE", Seats: 6},
				{Code: "1A", Name: "AC First Class", Fare: base3A * 1.8, Status: "AVAILABLE", Seats: 2},
				{Code: "SL", Name: "Sleeper Class", Fare: base3A * 0.42, Status: "WAITLIST", Seats: 18},
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

	// 2. Add Multi-modal options (Flights / Buses) for multi-modal comparison
	offers = append(offers, providers.NormalizedOffer{
		ProviderID:      "duffel_flight",
		Mode:            providers.ModeFlight,
		OperatorName:    "IndiGo (6E-2054)",
		ServiceNumber:   "6E-2054",
		OriginCode:      query.OriginCode,
		DestCode:        query.DestCode,
		DepartureAt:     parseClock(depDate, "09:30", 0),
		ArrivalAt:       parseClock(depDate, "11:45", 0),
		DurationMinutes: 135,
		Price:           4890.00,
		Currency:        "INR",
		Transfers:       0,
		Status:          "AVAILABLE",
		AvailableSeats:  12,
		BookingURL:      "https://www.goindigo.in",
		RetrievedAt:     time.Now().UTC(),
	})

	offers = append(offers, providers.NormalizedOffer{
		ProviderID:      "redbus_partner",
		Mode:            providers.ModeBus,
		OperatorName:    "Zingbus Plus Electric AC Sleeper",
		ServiceNumber:   "ZB-9921",
		OriginCode:      query.OriginCode,
		DestCode:        query.DestCode,
		DepartureAt:     parseClock(depDate, "20:30", 0),
		ArrivalAt:       parseClock(depDate, "14:00", 1),
		DurationMinutes: 1050,
		Price:           1420.00,
		Currency:        "INR",
		Transfers:       0,
		Status:          "AVAILABLE",
		AvailableSeats:  18,
		BookingURL:      "https://www.redbus.in",
		RetrievedAt:     time.Now().UTC(),
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
