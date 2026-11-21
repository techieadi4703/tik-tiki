package railway

import (
	"context"
	"testing"
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
