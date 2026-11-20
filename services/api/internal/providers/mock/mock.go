package mock

import (
	"context"
	"strings"
	"time"

	"tik-tiki/services/api/internal/providers"
)

// MockAdapter implements providers.ProviderAdapter for testing and initial demonstration
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

func (m *MockAdapter) Search(ctx context.Context, query providers.SearchQuery) ([]providers.NormalizedOffer, error) {
	depDate := query.DepartureDate
	if depDate.IsZero() {
		depDate = time.Now().Add(24 * time.Hour)
	}

	offers := []providers.NormalizedOffer{
		// 1. Direct Train
		{
			ProviderID:      "irctc_cris",
			Mode:            providers.ModeRail,
			OperatorName:    "Indian Railways",
			ServiceNumber:   "12955 (Mumbai-Jaipur Superfast)",
			OriginCode:      query.OriginCode,
			DestCode:        query.DestCode,
			DepartureAt:     time.Date(depDate.Year(), depDate.Month(), depDate.Day(), 19, 5, 0, 0, time.UTC),
			ArrivalAt:       time.Date(depDate.Year(), depDate.Month(), depDate.Day()+1, 12, 45, 0, 0, time.UTC),
			DurationMinutes: 1060,
			Price:           1640.00,
			Currency:        "INR",
			Transfers:       0,
			Status:          "WAITLIST",
			AvailableSeats:  0,
			BookingURL:      "https://www.irctc.co.in",
			RetrievedAt:     time.Now().UTC(),
		},
		// 2. High-speed Express Train
		{
			ProviderID:      "irctc_cris",
			Mode:            providers.ModeRail,
			OperatorName:    "Indian Railways",
			ServiceNumber:   "12951 (Tejas Rajdhani Express)",
			OriginCode:      query.OriginCode,
			DestCode:        query.DestCode,
			DepartureAt:     time.Date(depDate.Year(), depDate.Month(), depDate.Day(), 17, 0, 0, 0, time.UTC),
			ArrivalAt:       time.Date(depDate.Year(), depDate.Month(), depDate.Day()+1, 8, 30, 0, 0, time.UTC),
			DurationMinutes: 930,
			Price:           2850.00,
			Currency:        "INR",
			Transfers:       0,
			Status:          "AVAILABLE",
			AvailableSeats:  8,
			BookingURL:      "https://www.irctc.co.in",
			RetrievedAt:     time.Now().UTC(),
		},
		// 3. Premium Intercity Bus
		{
			ProviderID:      "redbus_affiliate",
			Mode:            providers.ModeBus,
			OperatorName:    "Zingbus Plus Electric AC Sleeper",
			ServiceNumber:   "ZB-9921",
			OriginCode:      query.OriginCode,
			DestCode:        query.DestCode,
			DepartureAt:     time.Date(depDate.Year(), depDate.Month(), depDate.Day(), 20, 30, 0, 0, time.UTC),
			ArrivalAt:       time.Date(depDate.Year(), depDate.Month(), depDate.Day()+1, 14, 0, 0, 0, time.UTC),
			DurationMinutes: 1050,
			Price:           1420.00,
			Currency:        "INR",
			Transfers:       0,
			Status:          "AVAILABLE",
			AvailableSeats:  14,
			BookingURL:      "https://www.redbus.in?ref=tiktiki",
			RetrievedAt:     time.Now().UTC(),
		},
		// 4. Nonstop Flight
		{
			ProviderID:      "duffel_flight",
			Mode:            providers.ModeFlight,
			OperatorName:    "IndiGo (6E-6512)",
			ServiceNumber:   "6E-6512",
			OriginCode:      query.OriginCode,
			DestCode:        query.DestCode,
			DepartureAt:     time.Date(depDate.Year(), depDate.Month(), depDate.Day(), 9, 30, 0, 0, time.UTC),
			ArrivalAt:       time.Date(depDate.Year(), depDate.Month(), depDate.Day(), 11, 25, 0, 0, time.UTC),
			DurationMinutes: 115,
			Price:           4890.00,
			Currency:        "INR",
			Transfers:       0,
			Status:          "AVAILABLE",
			AvailableSeats:  9,
			BookingURL:      "https://www.goindigo.in?ref=tiktiki",
			RetrievedAt:     time.Now().UTC(),
		},
	}

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
