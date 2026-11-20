package scoring

import (
	"testing"
	"time"

	"tik-tiki/services/api/internal/providers"
)

func TestCalculateScores(t *testing.T) {
	now := time.Now()
	offers := []providers.NormalizedOffer{
		{
			ServiceNumber:   "TRAIN-1",
			Price:           1500,
			DurationMinutes: 600,
			Status:          "AVAILABLE",
			Transfers:       0,
			DepartureAt:     now,
		},
		{
			ServiceNumber:   "TRAIN-2",
			Price:           3000,
			DurationMinutes: 1200,
			Status:          "WAITLIST",
			Transfers:       2,
			DepartureAt:     now,
		},
	}

	scored := CalculateScores(offers)

	if len(scored) != 2 {
		t.Fatalf("expected 2 offers, got %d", len(scored))
	}

	if scored[0].Score <= scored[1].Score {
		t.Errorf("expected cheaper, faster, available offer to score higher! Got %d vs %d", scored[0].Score, scored[1].Score)
	}

	if scored[0].Score < 70 {
		t.Errorf("expected prime offer to score high (>70), got %d", scored[0].Score)
	}
}
