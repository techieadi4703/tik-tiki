package routes

import (
	"testing"
	"time"
)

func sampleTrainStops() []TrainStop {
	return []TrainStop{
		{TrainNumber: "11059", StationCode: "LTT", StationName: "Lokmanya Tilak Terminus", SequenceNumber: 1, DistanceKm: 0},
		{TrainNumber: "11059", StationCode: "KYN", StationName: "Kalyan Junction", SequenceNumber: 2, DistanceKm: 55},
		{TrainNumber: "11059", StationCode: "NK", StationName: "Nashik Road", SequenceNumber: 3, DistanceKm: 187},
		{TrainNumber: "11059", StationCode: "MMR", StationName: "Manmad Junction", SequenceNumber: 4, DistanceKm: 260},
		{TrainNumber: "11059", StationCode: "BSL", StationName: "Bhusaval Junction", SequenceNumber: 5, DistanceKm: 444},
		{TrainNumber: "11059", StationCode: "KNW", StationName: "Khandwa Junction", SequenceNumber: 6, DistanceKm: 568},
		{TrainNumber: "11059", StationCode: "ET", StationName: "Itarsi Junction", SequenceNumber: 7, DistanceKm: 751},
		{TrainNumber: "11059", StationCode: "JBP", StationName: "Jabalpur", SequenceNumber: 8, DistanceKm: 996},
		{TrainNumber: "11059", StationCode: "KTE", StationName: "Katni Junction", SequenceNumber: 9, DistanceKm: 1087},
		{TrainNumber: "11059", StationCode: "STA", StationName: "Satna Junction", SequenceNumber: 10, DistanceKm: 1185},
		{TrainNumber: "11059", StationCode: "PRYJ", StationName: "Prayagraj Junction", SequenceNumber: 11, DistanceKm: 1362},
	}
}

func TestStrategy1_UpstreamBooking(t *testing.T) {
	stops := sampleTrainStops()

	t.Run("Finds upstream stations for Itarsi to Prayagraj within budget", func(t *testing.T) {
		options := FindUpstreamOptions(stops, "ET", "PRYJ", "3A", 2, 350.0)
		if len(options) == 0 {
			t.Fatalf("expected upstream booking options, got 0")
		}

		// First candidate should be Khandwa (KNW) or Bhusaval (BSL)
		first := options[0]
		if first.BoardAtStation != "Itarsi Junction (ET)" {
			t.Errorf("expected boarding station to be Itarsi, got %s", first.BoardAtStation)
		}
		if first.EstimatedExtraFareINR <= 0 || first.EstimatedExtraFareINR > 350 {
			t.Errorf("expected extra fare <= 350, got %.2f", first.EstimatedExtraFareINR)
		}
	})

	t.Run("Returns nil when origin is the starting station (LTT)", func(t *testing.T) {
		options := FindUpstreamOptions(stops, "LTT", "PRYJ", "3A", 2, 350.0)
		if len(options) != 0 {
			t.Errorf("expected 0 options when origin is start of line, got %d", len(options))
		}
	})

	t.Run("Returns nil when destination comes before origin", func(t *testing.T) {
		options := FindUpstreamOptions(stops, "PRYJ", "ET", "3A", 2, 350.0)
		if len(options) != 0 {
			t.Errorf("expected nil for reverse direction, got %d", len(options))
		}
	})
}

func TestStrategy2_DelayAwareConnectingRoute(t *testing.T) {
	baseTime := time.Date(2026, 12, 24, 8, 0, 0, 0, time.UTC)

	t.Run("Rejects connection where Train 2 departs before Train 1 arrives", func(t *testing.T) {
		t1Dep := baseTime
		t1Arr := baseTime.Add(10 * time.Hour)
		t2Dep := baseTime.Add(9 * time.Hour) // Impossible: 1h before arrival
		t2Arr := t2Dep.Add(6 * time.Hour)

		_, err := EvaluateConnectingRoute("ET", "12155", "Shaan-e-Bhopal", t1Dep, t1Arr, 30, "12854", "Amarkantak", t2Dep, t2Arr, 1600)
		if err == nil {
			t.Errorf("expected error for impossible connection, got nil")
		}
	})

	t.Run("Rejects connection with buffer under 90 minutes", func(t *testing.T) {
		t1Dep := baseTime
		t1Arr := baseTime.Add(10 * time.Hour)
		t2Dep := t1Arr.Add(45 * time.Minute) // Only 45 mins buffer
		t2Arr := t2Dep.Add(6 * time.Hour)

		_, err := EvaluateConnectingRoute("ET", "12155", "Shaan-e-Bhopal", t1Dep, t1Arr, 30, "12854", "Amarkantak", t2Dep, t2Arr, 1600)
		if err == nil {
			t.Errorf("expected error for tight buffer under 90m, got nil")
		}
	})

	t.Run("Rejects connection where historical delay wipes out effective cushion", func(t *testing.T) {
		t1Dep := baseTime
		t1Arr := baseTime.Add(10 * time.Hour)
		t2Dep := t1Arr.Add(100 * time.Minute) // 100 mins buffer
		t2Arr := t2Dep.Add(6 * time.Hour)
		avgDelay := 75 // 75 mins delay + 25m transfer = 100m -> 0m slack!

		_, err := EvaluateConnectingRoute("ET", "12155", "Shaan-e-Bhopal", t1Dep, t1Arr, avgDelay, "12854", "Amarkantak", t2Dep, t2Arr, 1600)
		if err == nil {
			t.Errorf("expected rejection when delay eliminates effective cushion, got nil")
		}
	})

	t.Run("Approves safe connection with ample real-world slack", func(t *testing.T) {
		t1Dep := baseTime
		t1Arr := baseTime.Add(10 * time.Hour)
		t2Dep := t1Arr.Add(180 * time.Minute) // 3h scheduled buffer
		t2Arr := t2Dep.Add(6 * time.Hour)
		avgDelay := 40 // 40m delay + 25m transfer = 65m -> 115m effective slack!

		route, err := EvaluateConnectingRoute("ET", "12155", "Shaan-e-Bhopal", t1Dep, t1Arr, avgDelay, "12854", "Amarkantak", t2Dep, t2Arr, 1600)
		if err != nil {
			t.Fatalf("unexpected error for safe connection: %v", err)
		}

		if route.RiskGrade != "SAFE" {
			t.Errorf("expected SAFE risk grade, got %s", route.RiskGrade)
		}
		if route.EffectiveSlackMinutes != 115 {
			t.Errorf("expected 115m effective slack, got %d", route.EffectiveSlackMinutes)
		}
	})
}
