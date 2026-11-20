package providers

import (
	"context"
	"time"
)

// Mode represents transport mode
type Mode string

const (
	ModeRail       Mode = "RAIL"
	ModeBus        Mode = "BUS"
	ModeFlight     Mode = "FLIGHT"
	ModeMultimodal Mode = "MULTIMODAL"
)

// SearchQuery represents a normalized search input
type SearchQuery struct {
	OriginCode    string    `json:"origin_code"`    // e.g. "BOM" or "NDLS"
	DestCode      string    `json:"dest_code"`      // e.g. "JAI" or "BCT"
	DepartureDate time.Time `json:"departure_date"`
	Passengers    int       `json:"passengers"`
	Modes         []Mode    `json:"modes"`
	Currency      string    `json:"currency"`
}

// RouteStopInfo holds details of intermediate halts on a train route
type RouteStopInfo struct {
	StationCode     string `json:"station_code"`
	StationName     string `json:"station_name"`
	ScheduledArrive string `json:"scheduled_arrive"`
	ScheduledDepart string `json:"scheduled_depart"`
	DistanceKm      int    `json:"distance_km"`
	HaltMinutes     int    `json:"halt_minutes"`
	PlatformNumber  int    `json:"platform_number"`
}

// NormalizedOffer is the canonical transport result returned by any adapter
type NormalizedOffer struct {
	ProviderID        string          `json:"provider_id"`
	Mode              Mode            `json:"mode"`
	OperatorName      string          `json:"operator_name"`
	ServiceNumber     string          `json:"service_number"`
	OriginCode        string          `json:"origin_code"`
	DestCode          string          `json:"dest_code"`
	DepartureAt       time.Time       `json:"departure_at"`
	ArrivalAt         time.Time       `json:"arrival_at"`
	DurationMinutes   int             `json:"duration_minutes"`
	Price             float64         `json:"price"`
	Currency          string          `json:"currency"`
	Transfers         int             `json:"transfers"`
	Status            string          `json:"status"` // AVAILABLE, RAC, WL, SOLD_OUT
	AvailableSeats    int             `json:"available_seats,omitempty"`
	BookingURL        string          `json:"booking_url"`
	RetrievedAt       time.Time       `json:"retrieved_at"`
	Score             int             `json:"score"` // Set by ScoringEngine
	DaysOfRun         []string        `json:"days_of_run,omitempty"`
	PantryAvailable   bool            `json:"pantry_available,omitempty"`
	PunctualityRating int             `json:"punctuality_rating,omitempty"`
	DeparturePlatform string          `json:"departure_platform,omitempty"`
	ArrivalPlatform   string          `json:"arrival_platform,omitempty"`
	Stops             []RouteStopInfo `json:"stops,omitempty"`
}

// ProviderAdapter defines the contract every external data source must implement
type ProviderAdapter interface {
	Code() string
	Category() Mode
	Search(ctx context.Context, query SearchQuery) ([]NormalizedOffer, error)
	CheckAvailability(ctx context.Context, serviceNo string, date time.Time, travelClass string) (string, int, error)
}
