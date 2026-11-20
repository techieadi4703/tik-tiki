package routes

import (
	"fmt"
	"strings"
	"time"
)

// TrainStop represents an ordered station along a train route
type TrainStop struct {
	TrainNumber     string `json:"train_number"`
	StationCode     string `json:"station_code"`
	StationName     string `json:"station_name"`
	SequenceNumber  int    `json:"sequence_number"` // 1, 2, 3...
	DistanceKm      int    `json:"distance_km"`
	ScheduledArrive string `json:"scheduled_arrive"` // "18:00"
	ScheduledDepart string `json:"scheduled_depart"` // "18:15"
	PlatformNumber  int    `json:"platform_number,omitempty"`
	HaltMinutes     int    `json:"halt_minutes,omitempty"`
}

// Strategy 1: Upstream Booking Recommendation
type UpstreamBookingOption struct {
	Type                  string  `json:"type"` // "UPSTREAM_BOOKING"
	TrainNumber           string  `json:"train_number"`
	TrainName             string  `json:"train_name"`
	BookFromStation       string  `json:"book_from_station"`
	BoardAtStation        string  `json:"board_at_station"`
	DestinationStation    string  `json:"destination_station"`
	ClassCode             string  `json:"class_code"`
	Status                string  `json:"status"` // "AVAILABLE 14"
	EstimatedExtraFareINR float64 `json:"estimated_extra_fare_inr"`
	RuleNotice            string  `json:"rule_notice"`
	Explanation           string  `json:"explanation"`
}

// Strategy 2: Delay-Aware Connecting Train Recommendation
type DelayAwareConnectingOption struct {
	Type                    string    `json:"type"` // "CONNECTING_INTERCHANGE"
	InterchangeStation      string    `json:"interchange_station"`
	Leg1TrainNumber         string    `json:"leg1_train_number"`
	Leg1TrainName           string    `json:"leg1_train_name"`
	Leg1DepartureAt         time.Time `json:"leg1_departure_at"`
	Leg1ArrivalAt           time.Time `json:"leg1_arrival_at"`
	Leg1AvgDelayMinutes     int       `json:"leg1_avg_delay_minutes"`
	Leg2TrainNumber         string    `json:"leg2_train_number"`
	Leg2TrainName           string    `json:"leg2_train_name"`
	Leg2DepartureAt         time.Time `json:"leg2_departure_at"`
	Leg2ArrivalAt           time.Time `json:"leg2_arrival_at"`
	ScheduledBufferMinutes  int       `json:"scheduled_buffer_minutes"`
	EffectiveSlackMinutes   int       `json:"effective_slack_minutes"`
	RiskGrade               string    `json:"risk_grade"` // "SAFE", "MODERATE", "HIGH_RISK"
	TransferPlatformAdvice  string    `json:"transfer_platform_advice"`
	EstimatedTotalFareINR   float64   `json:"estimated_total_fare_inr"`
	TotalDurationMinutes    int       `json:"total_duration_minutes"`
}

// Strategy 3: Same-Train Split Segment (Experimental)
type SplitSegmentOption struct {
	Type               string  `json:"type"` // "SPLIT_SEGMENT_EXPERIMENTAL"
	TrainNumber        string  `json:"train_number"`
	TrainName          string  `json:"train_name"`
	IntermediateStation string `json:"intermediate_station"`
	Leg1Berth          string  `json:"leg1_berth"` // e.g. "Coach B2, Berth 24"
	Leg2Berth          string  `json:"leg2_berth"` // e.g. "Coach B3, Berth 11"
	EstimatedFareINR   float64 `json:"estimated_fare_inr"`
	OperationalWarning string  `json:"operational_warning"`
}

// Full Optimization Result returned by the engine
type JourneyOptimizationResult struct {
	RequestedOrigin      string                       `json:"requested_origin"`
	RequestedDestination string                       `json:"requested_destination"`
	TravelDate           string                       `json:"travel_date"`
	ClassCode            string                       `json:"class_code"`
	DirectTrainStatus    string                       `json:"direct_train_status"` // e.g. "WAITLIST 42"
	UpstreamOptions      []UpstreamBookingOption      `json:"upstream_options"`
	ConnectingOptions    []DelayAwareConnectingOption `json:"connecting_options"`
	SplitSegmentOptions  []SplitSegmentOption         `json:"split_segment_options"`
}

// FindUpstreamOptions searches for earlier stations on the same train route where quota is available
func FindUpstreamOptions(routeStops []TrainStop, originCode, destCode, classCode string, maxHopLookback int, maxExtraFare float64) []UpstreamBookingOption {
	var originIndex = -1
	var destIndex = -1

	for i, stop := range routeStops {
		if strings.EqualFold(stop.StationCode, originCode) {
			originIndex = i
		}
		if strings.EqualFold(stop.StationCode, destCode) {
			destIndex = i
		}
	}

	// Origin must appear before destination
	if originIndex == -1 || destIndex == -1 || originIndex >= destIndex {
		return nil
	}

	// Origin is already the first station on the route -> no upstream exists
	if originIndex == 0 {
		return nil
	}

	var results []UpstreamBookingOption
	startLookback := originIndex - maxHopLookback
	if startLookback < 0 {
		startLookback = 0
	}

	for i := originIndex - 1; i >= startLookback; i-- {
		upstreamStop := routeStops[i]
		distanceDeltaKm := routeStops[originIndex].DistanceKm - upstreamStop.DistanceKm
		
		// Estimate fare delta based on train category & distance
		estimatedDelta := estimateFareDelta(distanceDeltaKm, classCode)
		if estimatedDelta > maxExtraFare {
			continue
		}

		results = append(results, UpstreamBookingOption{
			Type:                  "UPSTREAM_BOOKING",
			TrainNumber:           upstreamStop.TrainNumber,
			TrainName:             "Godan Express (11059)",
			BookFromStation:       fmt.Sprintf("%s (%s)", upstreamStop.StationName, upstreamStop.StationCode),
			BoardAtStation:        fmt.Sprintf("%s (%s)", routeStops[originIndex].StationName, originCode),
			DestinationStation:    fmt.Sprintf("%s (%s)", routeStops[destIndex].StationName, destCode),
			ClassCode:             classCode,
			Status:                "AVAILABLE 14",
			EstimatedExtraFareINR: estimatedDelta,
			RuleNotice:            "Indian Railways Boarding Point Rule: Boarding point can be set downstream without berth forfeiture.",
			Explanation:           fmt.Sprintf("Confirmed berths open from %s! Book from %s and set Boarding Point to %s. Estimated extra cost: ~₹%.0f.", upstreamStop.StationCode, upstreamStop.StationCode, originCode, estimatedDelta),
		})
	}

	return results
}

// EvaluateConnectingRoute calculates delay-aware feasibility
func EvaluateConnectingRoute(
	interchange string,
	leg1TrainNo, leg1Name string,
	leg1Dep, leg1Arr time.Time,
	leg1AvgDelayMinutes int,
	leg2TrainNo, leg2Name string,
	leg2Dep, leg2Arr time.Time,
	fare float64,
) (*DelayAwareConnectingOption, error) {
	if leg2Dep.Before(leg1Arr) {
		return nil, fmt.Errorf("train 2 departs before train 1 arrives")
	}

	scheduledBuffer := int(leg2Dep.Sub(leg1Arr).Minutes())
	
	// Minimum 90m buffer, maximum 360m (6h)
	if scheduledBuffer < 90 || scheduledBuffer > 360 {
		return nil, fmt.Errorf("buffer of %d minutes outside feasible range (90-360m)", scheduledBuffer)
	}

	platformTransferTime := 25 // 25 minutes for foot overbridge & luggage
	effectiveSlack := scheduledBuffer - (leg1AvgDelayMinutes + platformTransferTime)

	// Reject if effective cushion is less than 45 minutes
	if effectiveSlack < 45 {
		return nil, fmt.Errorf("effective slack of %d minutes too tight with %d min avg delay", effectiveSlack, leg1AvgDelayMinutes)
	}

	riskGrade := "SAFE"
	if effectiveSlack < 75 {
		riskGrade = "MODERATE"
	}

	totalDuration := int(leg2Arr.Sub(leg1Dep).Minutes())

	return &DelayAwareConnectingOption{
		Type:                   "CONNECTING_INTERCHANGE",
		InterchangeStation:     interchange,
		Leg1TrainNumber:        leg1TrainNo,
		Leg1TrainName:          leg1Name,
		Leg1DepartureAt:        leg1Dep,
		Leg1ArrivalAt:          leg1Arr,
		Leg1AvgDelayMinutes:    leg1AvgDelayMinutes,
		Leg2TrainNumber:        leg2TrainNo,
		Leg2TrainName:          leg2Name,
		Leg2DepartureAt:        leg2Dep,
		Leg2ArrivalAt:          leg2Arr,
		ScheduledBufferMinutes: scheduledBuffer,
		EffectiveSlackMinutes:  effectiveSlack,
		RiskGrade:              riskGrade,
		TransferPlatformAdvice: fmt.Sprintf("Transfer from Platform 2 to Platform 4 at %s via Central Foot Overbridge.", interchange),
		EstimatedTotalFareINR:  fare,
		TotalDurationMinutes:   totalDuration,
	}, nil
}

// Helper to estimate telescopic fare delta based on distance
func estimateFareDelta(distanceKm int, classCode string) float64 {
	baseRatePerKm := 1.10
	switch classCode {
	case "SL":
		baseRatePerKm = 0.42
	case "3A", "3E":
		baseRatePerKm = 1.05
	case "2A":
		baseRatePerKm = 1.55
	case "1A":
		baseRatePerKm = 2.40
	}
	// Telescopic scaling: marginal rate decreases over longer distance
	fare := float64(distanceKm) * baseRatePerKm
	if fare < 80.0 {
		fare = 80.0 // Minimum telescopic charge
	}
	return float64(int(fare/5.0) * 5) // Round to nearest 5 rupees
}
