package scoring

import (
	"testing"
	"time"

	"tik-tiki/services/api/internal/providers"
)

func TestCalculateScores_Comprehensive(t *testing.T) {
	now := time.Now()

	t.Run("Empty slice returns empty slice safely", func(t *testing.T) {
		result := CalculateScores([]providers.NormalizedOffer{})
		if len(result) != 0 {
			t.Errorf("expected empty slice, got length %d", len(result))
		}
	})

	t.Run("Relative ranking honors price, speed, and availability", func(t *testing.T) {
		offers := []providers.NormalizedOffer{
			{
				ServiceNumber:   "TRAIN-BEST",
				Price:           1200,
				DurationMinutes: 400,
				Status:          "AVAILABLE",
				Transfers:       0,
				DepartureAt:     time.Date(2026, 12, 24, 10, 0, 0, 0, time.UTC), // 10:00 daytime
			},
			{
				ServiceNumber:   "TRAIN-MEDIOCRE",
				Price:           2400,
				DurationMinutes: 800,
				Status:          "RAC",
				Transfers:       1,
				DepartureAt:     time.Date(2026, 12, 24, 14, 0, 0, 0, time.UTC), // 14:00 daytime
			},
			{
				ServiceNumber:   "TRAIN-WORST",
				Price:           4800,
				DurationMinutes: 1600,
				Status:          "WAITLIST",
				Transfers:       2,
				DepartureAt:     time.Date(2026, 12, 24, 23, 30, 0, 0, time.UTC), // Red-eye midnight
			},
		}

		scored := CalculateScores(offers)

		if scored[0].Score <= scored[1].Score {
			t.Errorf("expected Best (%d) > Mediocre (%d)", scored[0].Score, scored[1].Score)
		}
		if scored[1].Score <= scored[2].Score {
			t.Errorf("expected Mediocre (%d) > Worst (%d)", scored[1].Score, scored[2].Score)
		}

		// Ensure scores are bounded strictly between 0 and 100
		for _, o := range scored {
			if o.Score < 0 || o.Score > 100 {
				t.Errorf("offer %s score %d is out of [0, 100] bounds", o.ServiceNumber, o.Score)
			}
		}
	})

	t.Run("Red-eye departure penalty applies", func(t *testing.T) {
		dayScore := normalizeConvenience(0, 15)   // 15:00
		nightScore := normalizeConvenience(0, 23) // 23:00 red-eye

		if nightScore >= dayScore {
			t.Errorf("expected red-eye score (%f) to be penalized compared to daytime (%f)", nightScore, dayScore)
		}
	})

	t.Run("Handles zero and extreme prices gracefully without panic", func(t *testing.T) {
		offers := []providers.NormalizedOffer{
			{
				ServiceNumber:   "ZERO-PRICE",
				Price:           0,
				DurationMinutes: 0,
				Status:          "AVAILABLE",
				DepartureAt:     now,
			},
			{
				ServiceNumber:   "NORMAL-PRICE",
				Price:           1000,
				DurationMinutes: 500,
				Status:          "AVAILABLE",
				DepartureAt:     now,
			},
		}

		scored := CalculateScores(offers)
		if len(scored) != 2 {
			t.Fatalf("expected 2 scored offers, got %d", len(scored))
		}
	})
}
