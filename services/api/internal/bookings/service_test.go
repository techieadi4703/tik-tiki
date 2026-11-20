package bookings

import (
	"testing"
)

func TestBookingManager_Flow(t *testing.T) {
	bm := NewBookingManager()

	// 1. Verify seeded sample booking
	trips := bm.ListUserBookings("usr_demo")
	if len(trips) != 1 {
		t.Fatalf("expected 1 seeded trip, got %d", len(trips))
	}
	if trips[0].PNR != "284-9182741" {
		t.Errorf("expected sample PNR '284-9182741', got '%s'", trips[0].PNR)
	}

	// 2. Initiate booking
	initReq := InitiateBookingRequest{
		TrainNumber:   "12953",
		TrainName:     "August Kranti Tejas Rajdhani",
		OriginCode:    "MMCT",
		DestCode:      "NDLS",
		DepartureAt:   "2026-12-16T17:10:00Z",
		ArrivalAt:     "2026-12-17T10:55:00Z",
		ClassCode:     "3A",
		TotalFare:     2780.00,
		IRCTCUsername: "aditya_srivastava",
		Passengers: []Passenger{
			{FullName: "Aditya Srivastava", Age: 26, Gender: "MALE", BerthPreference: "LOWER"},
		},
	}

	b, err := bm.InitiateBooking(initReq)
	if err != nil {
		t.Fatalf("unexpected initiate booking error: %v", err)
	}
	if b.Status != "PENDING_AUTH" {
		t.Errorf("expected status 'PENDING_AUTH', got '%s'", b.Status)
	}
	if b.ID == "" {
		t.Errorf("expected non-empty booking ID")
	}

	// 3. Confirm booking with IRCTC credentials
	confirmed, err := bm.ConfirmBooking(b.ID, "secure_irctc_password123")
	if err != nil {
		t.Fatalf("unexpected confirm booking error: %v", err)
	}
	if confirmed.Status != "CONFIRMED" {
		t.Errorf("expected status 'CONFIRMED', got '%s'", confirmed.Status)
	}
	if len(confirmed.PNR) != 11 { // e.g. "123-4567890" (3 digits + '-' + 7 digits)
		t.Errorf("expected 11-char formatted PNR (10 digits + dash), got '%s'", confirmed.PNR)
	}
	if confirmed.CoachNumber != "B2" {
		t.Errorf("expected Coach B2 for 3A class, got '%s'", confirmed.CoachNumber)
	}

	// 4. Verify trip is in user trips list
	allTrips := bm.ListUserBookings("usr_demo")
	if len(allTrips) != 2 {
		t.Errorf("expected 2 confirmed trips, got %d", len(allTrips))
	}

	// 5. Lookup by PNR
	lookup, err := bm.GetBookingByPNR(confirmed.PNR)
	if err != nil {
		t.Fatalf("unexpected PNR lookup error: %v", err)
	}
	if lookup.ID != b.ID {
		t.Errorf("expected booking ID '%s', got '%s'", b.ID, lookup.ID)
	}
}
