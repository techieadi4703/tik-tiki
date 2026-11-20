package worker

import (
	"fmt"
	"log"
	"strings"
	"time"
)

// Dispatcher manages delivering notifications across channels
type Dispatcher struct {
	BaseDeepLinkURL string
}

func NewDispatcher(baseURL string) *Dispatcher {
	if baseURL == "" {
		baseURL = "https://tiktiki.com/b"
	}
	return &Dispatcher{
		BaseDeepLinkURL: baseURL,
	}
}

// BuildPayload formats the notification payload with actionable deep-link
func (d *Dispatcher) BuildPayload(watch WatchSubscription, availableSeats int, triggeredAt time.Time) NotificationPayload {
	dateStr := watch.DepartureDate.Format("02 Jan 2006")
	deepLink := fmt.Sprintf("%s/%s?date=%s&from=%s&to=%s&class=%s&ref=alert",
		d.BaseDeepLinkURL,
		watch.ServiceNumber,
		watch.DepartureDate.Format("2006-01-02"),
		watch.Origin,
		watch.Destination,
		watch.ClassCode,
	)

	messageText := fmt.Sprintf("🚨 Seat Alert! %d berths just opened up in %s on Train %s (%s to %s) for %s! Tap to book immediately on IRCTC: %s",
		availableSeats,
		watch.ClassCode,
		watch.ServiceNumber,
		watch.Origin,
		watch.Destination,
		dateStr,
		deepLink,
	)

	return NotificationPayload{
		AlertID:         watch.ID,
		Channel:         watch.NotificationChannel,
		Recipient:       watch.Recipient,
		ServiceNumber:   watch.ServiceNumber,
		TrainName:       "Indian Railways Superfast",
		RouteSummary:    fmt.Sprintf("%s → %s", watch.Origin, watch.Destination),
		TravelDate:      dateStr,
		AvailableSeats:  availableSeats,
		BookingDeepLink: deepLink,
		MessageText:     messageText,
		TriggeredAt:     triggeredAt,
	}
}

// Dispatch sends the message through the appropriate channel driver
func (d *Dispatcher) Dispatch(payload NotificationPayload) error {
	switch strings.ToUpper(payload.Channel) {
	case "WHATSAPP":
		return d.dispatchWhatsApp(payload)
	case "WEB_PUSH":
		return d.dispatchWebPush(payload)
	case "EMAIL":
		return d.dispatchEmail(payload)
	default:
		return fmt.Errorf("unsupported notification channel: %s", payload.Channel)
	}
}

func (d *Dispatcher) dispatchWhatsApp(p NotificationPayload) error {
	// Template dispatch execution (simulated / Gupshup API caller)
	log.Printf("[WHATSAPP DISPATCH] To: %s | Message: %s", p.Recipient, p.MessageText)
	return nil
}

func (d *Dispatcher) dispatchWebPush(p NotificationPayload) error {
	// Web Push VAPID delivery execution
	log.Printf("[WEB PUSH DISPATCH] Recipient: %s | Title: Seat Alert! %s | URL: %s", p.Recipient, p.ServiceNumber, p.BookingDeepLink)
	return nil
}

func (d *Dispatcher) dispatchEmail(p NotificationPayload) error {
	// Resend / SMTP delivery execution
	log.Printf("[EMAIL DISPATCH] To: %s | Subject: Confirmed Seats Opened on %s | Link: %s", p.Recipient, p.ServiceNumber, p.BookingDeepLink)
	return nil
}
