package bookings

import (
	"testing"
)

func TestBookingManager_Flow(t *testing.T) {
	bm := NewBookingManager()

	// 1. Verify seeded sample booking
	trips := bm.ListUserBookings("usr_demo")
	if len(trips) < 1 {
		t.Fatalf("expected at least 1 seeded trip, got %d", len(trips))
	}
	if trips[0].PNR != "284-9182741" {
		t.Errorf("expected sample PNR '284-9182741', got '%s'", trips[0].PNR)
	}

	// 2. Initiate multi-passenger booking (3 passengers with Senior Citizen)
	initReq := InitiateBookingRequest{
		TrainNumber:   "12953",
		TrainName:     "August Kranti Tejas Rajdhani",
		OriginCode:    "MMCT",
		DestCode:      "NDLS",
		DepartureAt:   "2026-12-16T17:10:00Z",
		ArrivalAt:     "2026-12-17T10:55:00Z",
		ClassCode:     "3A",
		Quota:         "GN",
		TotalFare:     8340.00,
		IRCTCUsername: "aditya_srivastava",
		Passengers: []Passenger{
			{FullName: "Aditya Srivastava", Age: 26, Gender: "MALE", BerthPreference: "LOWER"},
			{FullName: "Sunita Srivastava", Age: 61, Gender: "FEMALE", BerthPreference: "LOWER", SeniorCitizen: true},
			{FullName: "Rahul Verma", Age: 29, Gender: "MALE", BerthPreference: "UPPER"},
		},
	}

	b, err := bm.InitiateBooking(initReq)
	if err != nil {
		t.Fatalf("unexpected initiate booking error: %v", err)
	}
	if b.Status != "PENDING_AUTH" {
		t.Errorf("expected status 'PENDING_AUTH', got '%s'", b.Status)
	}
	if len(b.Passengers) != 3 {
		t.Errorf("expected 3 passengers in booking, got %d", len(b.Passengers))
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

	// Verify all passengers received individual berths and senior citizen got LOWER berth
	for idx, pax := range confirmed.Passengers {
		if pax.BerthAllocated == "" {
			t.Errorf("passenger %d missing allocated berth", idx+1)
		}
	}
	if confirmed.Passengers[1].BerthAllocated == "" || confirmed.Passengers[1].BerthPreference != "LOWER" {
		t.Errorf("expected senior citizen passenger to have Lower berth allocated")
	}

	// 4. Verify max 6 passengers guard
	tooManyPax := make([]Passenger, 7)
	for i := range tooManyPax {
		tooManyPax[i] = Passenger{FullName: "Passenger", Age: 30, Gender: "MALE"}
	}
	_, err = bm.InitiateBooking(InitiateBookingRequest{
		TrainNumber:   "12953",
		OriginCode:    "MMCT",
		DestCode:      "NDLS",
		IRCTCUsername: "ADITYA_CRIS",
		Passengers:    tooManyPax,
	})
	if err == nil {
		t.Errorf("expected error when exceeding 6 passengers per e-ticket")
	}
}
