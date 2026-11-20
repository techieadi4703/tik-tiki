package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"tik-tiki/services/api/internal/worker"
)

func main() {
	log.Println("🚀 Tiktiki Sniping Background Worker starting...")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	debounce := worker.NewDebounceGuard()
	dispatcher := worker.NewDispatcher("https://tiktiki.com/b")

	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	log.Println("✅ Sniping Polling Worker active. Monitoring active alert watches on adaptive cadence.")

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case t := <-ticker.C:
				// Worker polling iteration
				log.Printf("[WORKER TICK %s] Running adaptive watch reconciliation...", t.Format("15:04:05"))
				
				// In a real environment, reads active watches from DB
				// Simulating 1 cycle check with sample watch
				sampleWatch := worker.WatchSubscription{
					ID:                  "alt_demo_1",
					ServiceNumber:       "11059",
					Origin:              "ET",
					Destination:         "PRYJ",
					DepartureDate:       time.Now().Add(2 * time.Hour), // Inside 4-hour chart prep window
					ClassCode:           "3A",
					NotificationChannel: "WHATSAPP",
					Recipient:           "+919876543210",
					IsActive:            true,
				}

				interval := worker.CalculateAdaptiveInterval(sampleWatch.DepartureDate, false, time.Now())
				log.Printf("... Watch for %s has adaptive interval: %v", sampleWatch.ServiceNumber, interval)

				// Check debounce before dispatch
				if debounce.ShouldDispatch(sampleWatch.ID, 15*time.Minute, time.Now()) {
					payload := dispatcher.BuildPayload(sampleWatch, 2, time.Now())
					dispatcher.Dispatch(payload)
				}
			}
		}
	}()

	<-sigChan
	log.Println("🛑 Shutting down Sniping Worker gracefully...")
}
