package routes

import (
	"time"
)

// ConnectingRoute represents a multi-leg journey with evaluated transit risks
type ConnectingRoute struct {
	InterchangeStation string    `json:"interchange_station"`
	Leg1TrainNo        string    `json:"leg1_train_no"`
	Leg1Arrival        time.Time `json:"leg1_arrival"`
	Leg2TrainNo        string    `json:"leg2_train_no"`
	Leg2Departure      time.Time `json:"leg2_departure"`
	TransitBufferMins  int       `json:"transit_buffer_mins"`
	MissRiskPercentage float64   `json:"miss_risk_percentage"`
	RiskGrade          string    `json:"risk_grade"` // SAFE, MODERATE, RISKY
	TotalDurationMins  int       `json:"total_duration_mins"`
	EstimatedCostINR   float64   `json:"estimated_cost_inr"`
}

// SegmentHack represents an upstream or same-train split booking recommendation
type SegmentHack struct {
	Type          string  `json:"type"` // "UPSTREAM_BOOKING_WITH_BOARDING_CHANGE", "SAME_TRAIN_SPLIT"
	TrainNumber   string  `json:"train_number"`
	BookFrom      string  `json:"book_from"`
	BoardAt       string  `json:"board_at"`
	BookTo        string  `json:"book_to"`
	ClassCode     string  `json:"class_code"`
	Status        string  `json:"status"` // AVAILABLE
	AvailableBerths int   `json:"available_berths"`
	ExtraFareINR  float64 `json:"extra_fare_inr"`
	Explanation   string  `json:"explanation"`
}

// CalculateRiskScore evaluates the safety of a connection based on historical P95 delays
func CalculateRiskScore(bufferMinutes int, p95DelayMinutes int) (float64, string) {
	slack := bufferMinutes - p95DelayMinutes
	if slack >= 60 {
		return 3.0, "SAFE"
	} else if slack >= 30 {
		return 14.0, "SAFE"
	} else if slack >= 0 {
		return 38.0, "MODERATE"
	}
	return 85.0, "HIGH_RISK"
}
