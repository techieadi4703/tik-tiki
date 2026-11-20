package worker

import (
	"testing"
	"time"
)

func TestCalculateAdaptiveInterval(t *testing.T) {
	now := time.Date(2026, 12, 24, 10, 0, 0, 0, time.UTC)

	tests := []struct {
		name            string
		departureTime   time.Time
		isChartPrepared bool
		expected        time.Duration
	}{
		{
			name:            "Train already charted stops polling",
			departureTime:   now.Add(2 * time.Hour),
			isChartPrepared: true,
			expected:        0,
		},
		{
			name:            "Past train stops polling",
			departureTime:   now.Add(-1 * time.Hour),
			isChartPrepared: false,
			expected:        0,
		},
		{
			name:            "Chart prep window (2h remaining) polls every 60s",
			departureTime:   now.Add(2 * time.Hour),
			isChartPrepared: false,
			expected:        60 * time.Second,
		},
		{
			name:            "Moderate window (10h remaining) polls every 5 mins",
			departureTime:   now.Add(10 * time.Hour),
			isChartPrepared: false,
			expected:        5 * time.Minute,
		},
		{
			name:            "Far out window (48h remaining) polls every 30 mins",
			departureTime:   now.Add(48 * time.Hour),
			isChartPrepared: false,
			expected:        30 * time.Minute,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateAdaptiveInterval(tt.departureTime, tt.isChartPrepared, now)
			if got != tt.expected {
				t.Errorf("expected interval %v, got %v", tt.expected, got)
			}
		})
	}
}

func TestGroupWatchesByTuple(t *testing.T) {
	travelDate := time.Date(2026, 12, 24, 0, 0, 0, 0, time.UTC)

	watches := []WatchSubscription{
		{ID: "alt_1", ServiceNumber: "11059", DepartureDate: travelDate, Origin: "ET", Destination: "PRYJ", ClassCode: "3A", IsActive: true},
		{ID: "alt_2", ServiceNumber: "11059", DepartureDate: travelDate, Origin: "ET", Destination: "PRYJ", ClassCode: "3A", IsActive: true},
		{ID: "alt_3", ServiceNumber: "11059", DepartureDate: travelDate, Origin: "ET", Destination: "PRYJ", ClassCode: "3A", IsActive: false}, // Inactive
		{ID: "alt_4", ServiceNumber: "12951", DepartureDate: travelDate, Origin: "BOM", Destination: "NDLS", ClassCode: "2A", IsActive: true},
	}

	grouped := GroupWatchesByTuple(watches)

	expectedTuple1 := "11059:2026-12-24:ET:PRYJ:3A"
	if len(grouped[expectedTuple1]) != 2 {
		t.Errorf("expected 2 active watches for tuple %s, got %d", expectedTuple1, len(grouped[expectedTuple1]))
	}

	expectedTuple2 := "12951:2026-12-24:BOM:NDLS:2A"
	if len(grouped[expectedTuple2]) != 1 {
		t.Errorf("expected 1 active watch for tuple %s, got %d", expectedTuple2, len(grouped[expectedTuple2]))
	}
}

func TestDetectStateTransition(t *testing.T) {
	tests := []struct {
		name           string
		oldStatus      string
		newStatus      string
		shouldAlert    bool
		expectedReason string
	}{
		{
			name:           "Waitlist to Available triggers alert",
			oldStatus:      "GNWL 42",
			newStatus:      "AVAILABLE 4",
			shouldAlert:    true,
			expectedReason: "SEATS_OPENED",
		},
		{
			name:           "Waitlist to RAC triggers alert",
			oldStatus:      "WL 18",
			newStatus:      "RAC 2",
			shouldAlert:    true,
			expectedReason: "RAC_AVAILABLE",
		},
		{
			name:           "Waitlist movement (WL 42 to WL 10) does not trigger alert",
			oldStatus:      "WL 42",
			newStatus:      "WL 10",
			shouldAlert:    false,
			expectedReason: "NO_ACTION",
		},
		{
			name:           "Available to Waitlist (seats sold) does not trigger alert",
			oldStatus:      "AVAILABLE 2",
			newStatus:      "WL 5",
			shouldAlert:    false,
			expectedReason: "NO_ACTION",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			alert, reason := DetectStateTransition(tt.oldStatus, tt.newStatus)
			if alert != tt.shouldAlert {
				t.Errorf("expected shouldAlert %v, got %v", tt.shouldAlert, alert)
			}
			if reason != tt.expectedReason {
				t.Errorf("expected reason %s, got %s", tt.expectedReason, reason)
			}
		})
	}
}

func TestDebounceGuard(t *testing.T) {
	guard := NewDebounceGuard()
	now := time.Now()
	cooldown := 15 * time.Minute

	// First dispatch should succeed
	if !guard.ShouldDispatch("alt_test_1", cooldown, now) {
		t.Errorf("expected first dispatch to be allowed")
	}

	// Immediate repeat within cooldown must be suppressed
	if guard.ShouldDispatch("alt_test_1", cooldown, now.Add(2*time.Minute)) {
		t.Errorf("expected duplicate dispatch to be suppressed by debounce")
	}

	// Dispatch after 16 minutes must be allowed
	if !guard.ShouldDispatch("alt_test_1", cooldown, now.Add(16*time.Minute)) {
		t.Errorf("expected dispatch after cooldown to be allowed")
	}
}

func TestDispatcher_Channels(t *testing.T) {
	dispatcher := NewDispatcher("https://tiktiki.com/b")
	triggeredAt := time.Date(2026, 12, 24, 16, 0, 0, 0, time.UTC)

	watch := WatchSubscription{
		ID:                  "alt_100",
		ServiceNumber:       "11059",
		Origin:              "ET",
		Destination:         "PRYJ",
		DepartureDate:       triggeredAt,
		ClassCode:           "3A",
		NotificationChannel: "WHATSAPP",
		Recipient:           "+919876543210",
	}

	payload := dispatcher.BuildPayload(watch, 4, triggeredAt)

	if payload.AvailableSeats != 4 {
		t.Errorf("expected 4 seats in payload, got %d", payload.AvailableSeats)
	}
	if payload.BookingDeepLink == "" {
		t.Errorf("expected non-empty deep link")
	}

	// Test dispatch to WhatsApp
	if err := dispatcher.Dispatch(payload); err != nil {
		t.Fatalf("failed WhatsApp dispatch: %v", err)
	}

	// Test dispatch to Web Push
	payload.Channel = "WEB_PUSH"
	if err := dispatcher.Dispatch(payload); err != nil {
		t.Fatalf("failed Web Push dispatch: %v", err)
	}

	// Test dispatch to Email
	payload.Channel = "EMAIL"
	if err := dispatcher.Dispatch(payload); err != nil {
		t.Fatalf("failed Email dispatch: %v", err)
	}

	// Test invalid channel returns error
	payload.Channel = "CARRIER_PIGEON"
	if err := dispatcher.Dispatch(payload); err == nil {
		t.Errorf("expected error for unsupported channel, got nil")
	}
}
