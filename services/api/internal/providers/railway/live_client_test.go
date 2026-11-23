package railway

import (
	"context"
	"testing"
	"time"
)

func TestLiveClient_FallbackAvailability(t *testing.T) {
	client := NewLiveClient()
	ctx := context.Background()

	// Test with 12168 (Banaras - LTT Superfast)
	resp, err := client.CheckLiveAvailability(ctx, "12168", "BSB", "LTT", "2026-12-15", "3A", "GN")
	if err != nil {
		t.Fatalf("unexpected error checking availability: %v", err)
	}

	if resp == nil {
		t.Fatal("expected non-nil response")
	}

	if resp.TrainNumber != "12168" {
		t.Errorf("expected train number 12168, got %s", resp.TrainNumber)
	}

	if resp.ClassCode != "3A" {
		t.Errorf("expected class 3A, got %s", resp.ClassCode)
	}

	if resp.FareAmountINR <= 0 {
		t.Errorf("expected positive fare, got %f", resp.FareAmountINR)
	}

	if resp.Status != "AVAILABLE" && resp.Status != "RAC" && resp.Status != "WAITLIST" {
		t.Errorf("expected valid Indian Railways status, got %s", resp.Status)
	}
}

func TestLiveClient_CalculateFare(t *testing.T) {
	// 3A for 1400 km superfast
	fare3A := CalculateIndianRailwaysFare(1400, "3A", true)
	if fare3A < 1400 || fare3A > 2000 {
		t.Errorf("expected 3A fare for 1400km to be ~₹1,500-1,800, got %f", fare3A)
	}

	// Sleeper class for 1400 km superfast
	fareSL := CalculateIndianRailwaysFare(1400, "SL", true)
	if fareSL < 500 || fareSL > 750 {
		t.Errorf("expected SL fare for 1400km to be ~₹550-650, got %f", fareSL)
	}
}

func TestNormalizeStationCode(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Delhi", "NDLS"},
		{"DEL", "NDLS"},
		{"mumbai", "MMCT"},
		{"BOM", "MMCT"},
		{"Bangalore", "SBC"},
		{"Kolkata", "HWH"},
		{"CNB", "CNB"},
	}

	for _, tt := range tests {
		got := NormalizeStationCode(tt.input)
		if got != tt.expected {
			t.Errorf("NormalizeStationCode(%q) = %q; want %q", tt.input, got, tt.expected)
		}
	}
}

func TestLiveClient_ConvertExternalTrainsToOffers(t *testing.T) {
	trains := []ExternalTrainBetweenStations{
		{
			TrainNumber:     "22436",
			TrainName:       "Vande Bharat Express",
			RunDays:         []string{"Mon", "Tue", "Wed", "Fri", "Sat", "Sun"},
			FromStd:         "06:00",
			ToSta:           "10:08",
			From:            "NDLS",
			To:              "CNB",
			FromStationName: "NEW DELHI",
			ToStationName:   "KANPUR CENTRAL",
			Duration:        "4:8",
			Distance:        441,
			TrainType:       "VBEX",
			ClassType:       []string{"CC", "EC"},
		},
		{
			TrainNumber:     "12951",
			TrainName:       "Mumbai Central - New Delhi Rajdhani Express",
			RunDays:         []string{"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"},
			FromStd:         "17:00",
			ToSta:           "08:32",
			From:            "MMCT",
			To:              "NDLS",
			FromStationName: "MUMBAI CENTRAL",
			ToStationName:   "NEW DELHI",
			Duration:        "15:32",
			Distance:        1384,
			TrainType:       "RAJDHANI",
			ClassType:       []string{"3A", "2A", "1A"},
		},
	}

	offers := ConvertExternalTrainsToOffers(trains, time.Now())
	if len(offers) != 2 {
		t.Fatalf("expected 2 offers, got %d", len(offers))
	}

	vb := offers[0]
	if vb.ServiceNumber != "22436 (Vande Bharat Express)" {
		t.Errorf("unexpected service number: %s", vb.ServiceNumber)
	}
	if vb.DurationMinutes != 248 {
		t.Errorf("expected duration 248 mins, got %d", vb.DurationMinutes)
	}
	if len(vb.Classes) != 2 {
		t.Errorf("expected 2 classes for VB, got %d", len(vb.Classes))
	}
	// For 441 km CC fare should be around 500-1200
	if vb.Price < 400 || vb.Price > 1200 {
		t.Errorf("expected realistic CC fare for 441km, got %f", vb.Price)
	}

	raj := offers[1]
	if raj.ServiceNumber != "12951 (Mumbai Central - New Delhi Rajdhani Express)" {
		t.Errorf("unexpected service number: %s", raj.ServiceNumber)
	}
	// For 1384 km 3A fare should be around 1400-2200
	if raj.Price < 1400 || raj.Price > 2200 {
		t.Errorf("expected realistic 3A fare for 1384km, got %f", raj.Price)
	}
	// Verify fares are DIFFERENT for the two trains, not the same hardcoded value!
	if vb.Price == raj.Price {
		t.Errorf("train fares must reflect distance and class, but both got %f", vb.Price)
	}
}
