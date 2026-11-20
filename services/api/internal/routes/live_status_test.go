package routes

import (
	"strings"
	"testing"
)

func TestGetLiveTrainStatus_12168(t *testing.T) {
	status := GetLiveTrainStatus("12168")
	if status == nil {
		t.Fatal("expected non-nil live train status")
	}

	if status.TrainNumber != "12168" {
		t.Errorf("expected TrainNumber 12168, got %s", status.TrainNumber)
	}
	if !strings.Contains(status.TrainName, "Banaras") {
		t.Errorf("expected train name to contain 'Banaras', got %s", status.TrainName)
	}
	if len(status.Halts) == 0 {
		t.Errorf("expected halts to be populated for 12168, got 0")
	}
	if status.PunctualityText == "" {
		t.Errorf("expected punctuality text to be present")
	}
}

func TestGetLiveTrainStatus_12951(t *testing.T) {
	status := GetLiveTrainStatus("12951")
	if status == nil {
		t.Fatal("expected non-nil live train status")
	}

	if status.TrainNumber != "12951" {
		t.Errorf("expected TrainNumber 12951, got %s", status.TrainNumber)
	}
	if !strings.Contains(status.TrainName, "Rajdhani") {
		t.Errorf("expected train name to contain 'Rajdhani', got %s", status.TrainName)
	}
}
