package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"tik-tiki/services/api/internal/providers"
	"tik-tiki/services/api/internal/providers/mock"
	"tik-tiki/services/api/internal/routes"
	"tik-tiki/services/api/internal/scoring"
)

var mockAdapter = mock.NewMockAdapter()

type AlertRecord struct {
	ID                  string    `json:"id"`
	ServiceNumber       string    `json:"service_number"`
	Origin              string    `json:"origin"`
	Destination         string    `json:"destination"`
	DepartureDate       string    `json:"departure_date"`
	ClassCode           string    `json:"class_code"`
	DesiredState        string    `json:"desired_state"`
	NotificationChannel string    `json:"notification_channel"`
	Recipient           string    `json:"recipient"`
	Status              string    `json:"status"` // ACTIVE, TRIGGERED, CANCELLED
	CreatedAt           time.Time `json:"created_at"`
}

type CreateAlertRequest struct {
	ServiceNumber       string `json:"service_number"`
	Origin              string `json:"origin"`
	Destination         string `json:"destination"`
	DepartureDate       string `json:"departure_date"`
	ClassCode           string `json:"class_code"`
	DesiredState        string `json:"desired_state"`
	NotificationChannel string `json:"notification_channel"`
	PhoneNumber         string `json:"phone_number,omitempty"`
	Email               string `json:"email,omitempty"`
}

var (
	alertsMu   sync.RWMutex
	alertsList = make(map[string]AlertRecord)
)

type LocationItem struct {
	Code       string `json:"code"`
	Name       string `json:"name"`
	City       string `json:"city"`
	Country    string `json:"country"`
	Type       string `json:"type"`
	IsMajorHub bool   `json:"is_major_hub"`
}

var locationsCatalog = []LocationItem{
	{Code: "BOM", Name: "Chhatrapati Shivaji Maharaj Terminus", City: "Mumbai", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "MMCT", Name: "Mumbai Central", City: "Mumbai", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "NDLS", Name: "New Delhi Railway Station", City: "New Delhi", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "JAI", Name: "Jaipur Junction", City: "Jaipur", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "JP", Name: "Jaipur Junction", City: "Jaipur", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "ET", Name: "Itarsi Junction", City: "Itarsi", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "PRYJ", Name: "Prayagraj Junction", City: "Prayagraj", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "BSL", Name: "Bhusaval Junction", City: "Bhusaval", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "KNW", Name: "Khandwa Junction", City: "Khandwa", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "BPL", Name: "Bhopal Junction", City: "Bhopal", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "CNB", Name: "Kanpur Central", City: "Kanpur", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "BLR", Name: "KSR Bengaluru", City: "Bengaluru", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "MAS", Name: "Chennai Central", City: "Chennai", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "DEL", Name: "Indira Gandhi International Airport", City: "New Delhi", Country: "IN", Type: "airport", IsMajorHub: true},
}

var sampleGodanRoute = []routes.TrainStop{
	{TrainNumber: "11059", StationCode: "LTT", StationName: "Lokmanya Tilak Terminus", SequenceNumber: 1, DistanceKm: 0},
	{TrainNumber: "11059", StationCode: "KYN", StationName: "Kalyan Junction", SequenceNumber: 2, DistanceKm: 55},
	{TrainNumber: "11059", StationCode: "NK", StationName: "Nashik Road", SequenceNumber: 3, DistanceKm: 187},
	{TrainNumber: "11059", StationCode: "MMR", StationName: "Manmad Junction", SequenceNumber: 4, DistanceKm: 260},
	{TrainNumber: "11059", StationCode: "BSL", StationName: "Bhusaval Junction", SequenceNumber: 5, DistanceKm: 444},
	{TrainNumber: "11059", StationCode: "KNW", StationName: "Khandwa Junction", SequenceNumber: 6, DistanceKm: 568},
	{TrainNumber: "11059", StationCode: "ET", StationName: "Itarsi Junction", SequenceNumber: 7, DistanceKm: 751},
	{TrainNumber: "11059", StationCode: "JBP", StationName: "Jabalpur", SequenceNumber: 8, DistanceKm: 996},
	{TrainNumber: "11059", StationCode: "KTE", StationName: "Katni Junction", SequenceNumber: 9, DistanceKm: 1087},
	{TrainNumber: "11059", StationCode: "STA", StationName: "Satna Junction", SequenceNumber: 10, DistanceKm: 1185},
	{TrainNumber: "11059", StationCode: "PRYJ", StationName: "Prayagraj Junction", SequenceNumber: 11, DistanceKm: 1362},
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func handleLocations(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	query := strings.ToLower(r.URL.Query().Get("q"))
	var matched []LocationItem

	for _, loc := range locationsCatalog {
		if query == "" ||
			strings.Contains(strings.ToLower(loc.Name), query) ||
			strings.Contains(strings.ToLower(loc.City), query) ||
			strings.Contains(strings.ToLower(loc.Code), query) {
			matched = append(matched, loc)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"query":   query,
		"results": matched,
	})
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req providers.SearchQuery
	if r.Method == "POST" {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
			return
		}
	} else {
		req.OriginCode = r.URL.Query().Get("origin")
		req.DestCode = r.URL.Query().Get("destination")
	}

	if req.OriginCode == "" {
		req.OriginCode = "BOM"
	}
	if req.DestCode == "" {
		req.DestCode = "JAI"
	}

	offers, err := mockAdapter.Search(r.Context(), req)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	scoredOffers := scoring.CalculateScores(offers)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"search_id":   fmt.Sprintf("srch_%d", time.Now().UnixNano()),
		"origin":      req.OriginCode,
		"destination": req.DestCode,
		"currency":    "INR",
		"count":       len(scoredOffers),
		"results":     scoredOffers,
	})
}

func handleOptimizeJourneys(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	origin := r.URL.Query().Get("origin")
	dest := r.URL.Query().Get("destination")
	date := r.URL.Query().Get("date")
	classCode := r.URL.Query().Get("class")

	if origin == "" {
		origin = "ET"
	}
	if dest == "" {
		dest = "PRYJ"
	}
	if date == "" {
		date = "2026-12-24"
	}
	if classCode == "" {
		classCode = "3A"
	}

	isMumbaiDelhi := (strings.EqualFold(origin, "MMCT") || strings.EqualFold(origin, "BOM") || strings.EqualFold(origin, "BVI") || strings.EqualFold(origin, "ST")) &&
		(strings.EqualFold(dest, "NDLS") || strings.EqualFold(dest, "NZM") || strings.EqualFold(dest, "DEL"))

	var upstreamOptions []routes.UpstreamBookingOption
	var connectingOptions []routes.DelayAwareConnectingOption
	var splitOptions []routes.SplitSegmentOption

	now := time.Now()
	baseDate := time.Date(now.Year(), now.Month(), now.Day()+1, 11, 25, 0, 0, time.UTC)

	if isMumbaiDelhi {
		// 1. Strategy 1: Upstream for Mumbai-Delhi corridor (e.g. if searching from Borivali or Surat)
		westernStops := routes.GetRouteStopsForTrain("12951")
		if len(westernStops) > 0 {
			upstreamOptions = routes.FindUpstreamOptions(westernStops, origin, dest, classCode, 2, 350.0)
		}
		if len(upstreamOptions) == 0 && (strings.EqualFold(origin, "MMCT") || strings.EqualFold(origin, "BOM")) {
			// When origin is Mumbai Central terminal, upstream recommendation is to book from Borivali quota or downstream origin
			upstreamOptions = append(upstreamOptions, routes.UpstreamBookingOption{
				Type:                  "UPSTREAM_BOOKING",
				TrainNumber:           "12953",
				TrainName:             "August Kranti Tejas Rajdhani",
				BookFromStation:       "Borivali (BVI)",
				BoardAtStation:        "Surat (ST)",
				DestinationStation:    "New Delhi (NDLS)",
				ClassCode:             classCode,
				Status:                "AVAILABLE 12",
				EstimatedExtraFareINR: 120.00,
				RuleNotice:            "Boarding station can be set downstream during online booking without berth forfeiture.",
				Explanation:           "High demand from Mumbai Central terminal. Borivali quota has 12 open berths! Book from BVI with boarding at Surat.",
			})
		}

		// 2. Strategy 2: Delay-Aware Connecting Option via Kota Junction (KOTA)
		t1Arr := baseDate.Add(7 * time.Hour)                 // 18:25 at Kota
		t2Dep := t1Arr.Add(2*time.Hour + 30*time.Minute)     // 20:55 (2.5h buffer)
		t2Arr := t2Dep.Add(4 * time.Hour + 45*time.Minute)   // 01:40 at Delhi

		connectingOpt, err := routes.EvaluateConnectingRoute(
			"Kota Junction (KOTA)",
			"12953", "August Kranti Rajdhani",
			baseDate, t1Arr,
			25, // 25m P95 historical delay
			"12059", "Kota Jan Shatabdi Express",
			t2Dep, t2Arr,
			1780.0,
		)
		if err == nil && connectingOpt != nil {
			connectingOpt.TransferPlatformAdvice = "Transfer between Platform 1 and Platform 3 at Kota Junction via Foot Overbridge with elevator."
			connectingOptions = append(connectingOptions, *connectingOpt)
		}

		// 3. Strategy 3: Same-Train Split Booking at Vadodara Junction (BRC)
		splitOptions = append(splitOptions, routes.SplitSegmentOption{
			Type:                "SPLIT_SEGMENT_EXPERIMENTAL",
			TrainNumber:         "12951",
			TrainName:           "Tejas Rajdhani Express",
			IntermediateStation: "Vadodara Junction (BRC)",
			Leg1Berth:           "Coach B4, Berth 18 (Lower)",
			Leg2Berth:           "Coach B5, Berth 33 (Side Lower)",
			EstimatedFareINR:    2890.00,
			OperationalWarning:  "Requires physical coach change at Vadodara Junction. Move luggage between Coach B4 and B5 during the 10-minute halt.",
		})
	} else {
		// Central / Prayagraj Corridor
		upstreamOptions = routes.FindUpstreamOptions(sampleGodanRoute, origin, dest, classCode, 2, 350.0)

		t1Arr := baseDate.Add(9*time.Hour + 45*time.Minute) // Arr: 18:00
		t2Dep := t1Arr.Add(3 * time.Hour)                   // Dep: 21:00 (3h buffer)
		t2Arr := t2Dep.Add(6*time.Hour + 30*time.Minute)

		connectingOpt, err := routes.EvaluateConnectingRoute(
			"Itarsi Junction (ET)",
			"12155", "Shaan-e-Bhopal Express",
			baseDate, t1Arr,
			45, // 45m historical delay
			"12854", "Amarkantak Express",
			t2Dep, t2Arr,
			1680.0,
		)
		if err == nil && connectingOpt != nil {
			connectingOptions = append(connectingOptions, *connectingOpt)
		}

		splitOptions = append(splitOptions, routes.SplitSegmentOption{
			Type:                "SPLIT_SEGMENT_EXPERIMENTAL",
			TrainNumber:         "11059",
			TrainName:           "Godan Express",
			IntermediateStation: "Jabalpur (JBP)",
			Leg1Berth:           "Coach B2, Berth 24 (Lower)",
			Leg2Berth:           "Coach B3, Berth 11 (Side Lower)",
			EstimatedFareINR:    1420.00,
			OperationalWarning:  "Requires physical coach change at Jabalpur. Ensure all luggage is moved during the 15-minute halt.",
		})
	}

	resp := routes.JourneyOptimizationResult{
		RequestedOrigin:      origin,
		RequestedDestination: dest,
		TravelDate:           date,
		ClassCode:            classCode,
		DirectTrainStatus:    "WAITLIST 42",
		UpstreamOptions:      upstreamOptions,
		ConnectingOptions:    connectingOptions,
		SplitSegmentOptions:  splitOptions,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func handleSegmentHacks(w http.ResponseWriter, r *http.Request) {
	handleOptimizeJourneys(w, r)
}

func handleConnectingRoutes(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	now := time.Now()
	riskPercent, riskGrade := routes.CalculateRiskScore(130, 25)

	routesList := []routes.ConnectingRoute{
		{
			InterchangeStation: "BPL (Bhopal Junction)",
			Leg1TrainNo:        "12155 (Shaan-e-Bhopal)",
			Leg1Arrival:        now.Add(2 * time.Hour),
			Leg2TrainNo:        "12854 (Amarkantak Express)",
			Leg2Departure:      now.Add(4*time.Hour + 10*time.Minute),
			TransitBufferMins:  130,
			MissRiskPercentage: riskPercent,
			RiskGrade:          riskGrade,
			TotalDurationMins:  790,
			EstimatedCostINR:   1480.00,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"routes": routesList,
	})
}

var phoneRegex = regexp.MustCompile(`^\+?[0-9]{10,14}$`)

func handleAlerts(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method == "POST" {
		var req CreateAlertRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
			return
		}

		if req.ServiceNumber == "" || req.Origin == "" || req.Destination == "" {
			http.Error(w, `{"error": "service_number, origin, and destination are required"}`, http.StatusBadRequest)
			return
		}

		if req.NotificationChannel == "" {
			req.NotificationChannel = "WHATSAPP"
		}
		if req.DesiredState == "" {
			req.DesiredState = "AVAILABLE"
		}
		if req.ClassCode == "" {
			req.ClassCode = "3A"
		}

		recipient := ""
		switch req.NotificationChannel {
		case "WHATSAPP":
			cleanPhone := strings.ReplaceAll(req.PhoneNumber, " ", "")
			cleanPhone = strings.ReplaceAll(cleanPhone, "-", "")
			if !phoneRegex.MatchString(cleanPhone) {
				http.Error(w, `{"error": "A valid 10-14 digit phone number is required for WhatsApp alerts"}`, http.StatusBadRequest)
				return
			}
			recipient = cleanPhone
		case "EMAIL":
			if !strings.Contains(req.Email, "@") || !strings.Contains(req.Email, ".") {
				http.Error(w, `{"error": "A valid email address is required for Email alerts"}`, http.StatusBadRequest)
				return
			}
			recipient = req.Email
		case "WEB_PUSH":
			recipient = "browser_push_active"
		default:
			http.Error(w, `{"error": "Invalid notification channel. Supported: WHATSAPP, WEB_PUSH, EMAIL"}`, http.StatusBadRequest)
			return
		}

		alertID := fmt.Sprintf("alt_%d", time.Now().UnixNano())
		record := AlertRecord{
			ID:                  alertID,
			ServiceNumber:       req.ServiceNumber,
			Origin:              req.Origin,
			Destination:         req.Destination,
			DepartureDate:       req.DepartureDate,
			ClassCode:           req.ClassCode,
			DesiredState:        req.DesiredState,
			NotificationChannel: req.NotificationChannel,
			Recipient:           recipient,
			Status:              "ACTIVE",
			CreatedAt:           time.Now().UTC(),
		}

		alertsMu.Lock()
		alertsList[alertID] = record
		alertsMu.Unlock()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"alert_id":              alertID,
			"status":                "ACTIVE",
			"recipient":             recipient,
			"channel":               req.NotificationChannel,
			"poll_interval_seconds": 60,
			"message":               fmt.Sprintf("Monitoring active! We will alert %s via %s as soon as seats open.", recipient, req.NotificationChannel),
		})
		return
	}

	alertsMu.RLock()
	count := len(alertsList)
	alertsMu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"active_alerts_count": count,
		"status":              "ready",
	})
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/v1/health", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "healthy", "service": "tiktiki-api", "version": "1.0.0"}`))
	})

	mux.HandleFunc("/v1/locations/search", handleLocations)
	mux.HandleFunc("/v1/journeys/search", handleSearch)
	mux.HandleFunc("/v1/journeys/optimize", handleOptimizeJourneys)
	mux.HandleFunc("/v1/journeys/hacks", handleSegmentHacks)
	mux.HandleFunc("/v1/journeys/alternatives", handleConnectingRoutes)
	mux.HandleFunc("/v1/alerts", handleAlerts)

	port := "8080"
	log.Printf("🚀 Tiktiki API Server running at http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %s", err)
	}
}
