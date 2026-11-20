package scoring

import (
	"math"
	"tik-tiki/services/api/internal/providers"
)

// Weights for the Journey Utility Equation
// S = 0.40*C + 0.30*T + 0.20*R + 0.10*K
const (
	WeightCost        = 0.40
	WeightTime        = 0.30
	WeightReliability = 0.20
	WeightConvenience = 0.10
)

// CalculateScores takes a slice of offers, normalizes metrics across the cohort, and assigns a 0-100 score
func CalculateScores(offers []providers.NormalizedOffer) []providers.NormalizedOffer {
	if len(offers) == 0 {
		return offers
	}

	minPrice := math.MaxFloat64
	minDuration := math.MaxInt32

	for _, o := range offers {
		if o.Price > 0 && o.Price < minPrice {
			minPrice = o.Price
		}
		if o.DurationMinutes > 0 && o.DurationMinutes < minDuration {
			minDuration = o.DurationMinutes
		}
	}

	for i := range offers {
		cNorm := normalizeCost(offers[i].Price, minPrice)
		tNorm := normalizeTime(offers[i].DurationMinutes, minDuration)
		rNorm := normalizeReliability(offers[i].Status)
		kNorm := normalizeConvenience(offers[i].Transfers, offers[i].DepartureAt.Hour())

		finalScore := (WeightCost * cNorm) +
			(WeightTime * tNorm) +
			(WeightReliability * rNorm) +
			(WeightConvenience * kNorm)

		offers[i].Score = int(math.Round(math.Max(0, math.Min(100, finalScore))))
	}

	return offers
}

func normalizeCost(price, minPrice float64) float64 {
	if minPrice <= 0 || price <= 0 {
		return 50.0
	}
	ratio := (price - minPrice) / (2.0 * minPrice)
	return math.Max(0, (1.0-ratio)*100.0)
}

func normalizeTime(duration, minDuration int) float64 {
	if minDuration <= 0 || duration <= 0 {
		return 50.0
	}
	ratio := float64(duration-minDuration) / (2.0 * float64(minDuration))
	return math.Max(0, (1.0-ratio)*100.0)
}

func normalizeReliability(status string) float64 {
	switch status {
	case "AVAILABLE":
		return 100.0
	case "RAC":
		return 75.0
	case "WAITLIST":
		return 35.0
	case "SOLD_OUT":
		return 0.0
	default:
		return 50.0
	}
}

func normalizeConvenience(transfers, departureHour int) float64 {
	base := 100.0 - float64(transfers*35)
	// Penalize red-eye / extreme midnight departures (23:00 - 04:00)
	if departureHour >= 23 || departureHour < 4 {
		base -= 15.0
	}
	return math.Max(0, base)
}
