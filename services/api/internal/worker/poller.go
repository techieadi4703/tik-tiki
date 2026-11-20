package worker

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

// WatchSubscription represents an active user alert
type WatchSubscription struct {
	ID                  string    `json:"id"`
	UserID              string    `json:"user_id"`
	ServiceNumber       string    `json:"service_number"`
	Origin              string    `json:"origin"`
	Destination         string    `json:"destination"`
	DepartureDate       time.Time `json:"departure_date"`
	ClassCode           string    `json:"class_code"`
	DesiredState        string    `json:"desired_state"` // "AVAILABLE" or "RAC_OR_BETTER"
	NotificationChannel string    `json:"notification_channel"`
	Recipient           string    `json:"recipient"`
	LastNotifiedAt      time.Time `json:"last_notified_at"`
	IsActive            bool      `json:"is_active"`
}

// NotificationPayload is the canonical alert message delivered to any channel
type NotificationPayload struct {
	AlertID        string    `json:"alert_id"`
	Channel        string    `json:"channel"`
	Recipient      string    `json:"recipient"`
	ServiceNumber  string    `json:"service_number"`
	TrainName      string    `json:"train_name"`
	RouteSummary   string    `json:"route_summary"`
	TravelDate     string    `json:"travel_date"`
	AvailableSeats int       `json:"available_seats"`
	BookingDeepLink string   `json:"booking_deep_link"`
	MessageText    string    `json:"message_text"`
	TriggeredAt    time.Time `json:"triggered_at"`
}

// CalculateAdaptiveInterval computes polling frequency based on time-to-departure
func CalculateAdaptiveInterval(departureTime time.Time, isChartPrepared bool, now time.Time) time.Duration {
	if isChartPrepared {
		return 0 // Train charted, stop polling
	}

	timeRemaining := departureTime.Sub(now)

	// If departure is in the past, stop
	if timeRemaining <= 0 {
		return 0
	}

	// Chart preparation window (<= 4 hours): rapid 60-second polling
	if timeRemaining <= 4*time.Hour {
		return 60 * time.Second
	}

	// Moderate window (4 to 24 hours): 5-minute polling
	if timeRemaining <= 24*time.Hour {
		return 5 * time.Minute
	}

	// Far out (> 24 hours): 30-minute polling
	return 30 * time.Minute
}

// GroupWatchesByTuple aggregates thousands of user alerts into unique query keys
// Tuple Format: "SERVICE_NO:YYYY-MM-DD:FROM:TO:CLASS"
func GroupWatchesByTuple(watches []WatchSubscription) map[string][]WatchSubscription {
	grouped := make(map[string][]WatchSubscription)

	for _, w := range watches {
		if !w.IsActive {
			continue
		}
		dateStr := w.DepartureDate.Format("2006-01-02")
		tupleKey := fmt.Sprintf("%s:%s:%s:%s:%s",
			strings.ToUpper(w.ServiceNumber),
			dateStr,
			strings.ToUpper(w.Origin),
			strings.ToUpper(w.Destination),
			strings.ToUpper(w.ClassCode),
		)
		grouped[tupleKey] = append(grouped[tupleKey], w)
	}

	return grouped
}

// DetectStateTransition determines whether an availability change justifies dispatching an urgent alert
func DetectStateTransition(oldStatus, newStatus string) (bool, string) {
	oldUpper := strings.ToUpper(strings.TrimSpace(oldStatus))
	newUpper := strings.ToUpper(strings.TrimSpace(newStatus))

	// Transition from Waitlist/Sold Out to Available -> Immediate alert trigger!
	if (strings.Contains(oldUpper, "WL") || strings.Contains(oldUpper, "WAITLIST") || strings.Contains(oldUpper, "REGRET")) &&
		(strings.Contains(newUpper, "AVAILABLE") || strings.Contains(newUpper, "CURR_AVBL")) {
		return true, "SEATS_OPENED"
	}

	// Transition from Waitlist to RAC
	if (strings.Contains(oldUpper, "WL") || strings.Contains(oldUpper, "WAITLIST")) &&
		strings.Contains(newUpper, "RAC") {
		return true, "RAC_AVAILABLE"
	}

	// No actionable positive transition
	return false, "NO_ACTION"
}

// DebounceGuard prevents spamming users if seats flicker within a short cooldown window
type DebounceGuard struct {
	mu        sync.RWMutex
	cooldowns map[string]time.Time
}

func NewDebounceGuard() *DebounceGuard {
	return &DebounceGuard{
		cooldowns: make(map[string]time.Time),
	}
}

// ShouldDispatch returns true if the alert is outside the cooldown window
func (d *DebounceGuard) ShouldDispatch(alertID string, cooldown time.Duration, now time.Time) bool {
	d.mu.Lock()
	defer d.mu.Unlock()

	lastSent, exists := d.cooldowns[alertID]
	if !exists || now.Sub(lastSent) >= cooldown {
		d.cooldowns[alertID] = now
		return true
	}

	return false // Suppressed by debounce
}
