package timetable

import (
	"strings"
	"testing"
)

func TestStore_LoadedAndIndexed(t *testing.T) {
	store := GetGlobalStore()
	if store == nil {
		t.Fatal("expected non-nil store")
	}

	all := store.GetAllTrains()
	if len(all) < 10 {
		t.Fatalf("expected at least 10 national trains loaded, got %d", len(all))
	}

	// Test 12168 (Banaras - LTT Superfast)
	train12168, err := store.GetTrainByNumber("12168")
	if err != nil || train12168 == nil {
		t.Fatalf("expected train 12168 to be found, got error: %v", err)
	}
	if !strings.Contains(train12168.TrainName, "Banaras") {
		t.Errorf("expected train name to contain Banaras, got %s", train12168.TrainName)
	}
	if len(train12168.Stops) < 5 {
		t.Errorf("expected at least 5 stops for 12168, got %d", len(train12168.Stops))
	}

	// Test 12951 (Tejas Rajdhani)
	train12951, err := store.GetTrainByNumber("12951")
	if err != nil || train12951 == nil {
		t.Fatalf("expected train 12951 to be found, got error: %v", err)
	}
	if train12951.TrainName != "Tejas Rajdhani Express" {
		t.Errorf("expected Tejas Rajdhani Express, got %s", train12951.TrainName)
	}

	// Test Varanasi <-> Delhi corridor lookups
	vnsDel := store.FindAllTrainsBetweenStations("BSB", "NDLS")
	if len(vnsDel) < 4 {
		t.Errorf("expected at least 4 trains between BSB and NDLS, got %d", len(vnsDel))
	}
}
