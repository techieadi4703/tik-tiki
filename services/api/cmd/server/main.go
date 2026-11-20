package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"tik-tiki/services/api/internal/providers"
	"tik-tiki/services/api/internal/providers/mock"
	"tik-tiki/services/api/internal/routes"
	"tik-tiki/services/api/internal/scoring"
)

var mockAdapter = mock.NewMockAdapter()

// LocationItem for station/airport autocomplete
type LocationItem struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	City        string `json:"city"`
	Country     string `json:"country"`
	Type        string `json:"type"` // "railway_station", "airport", "city"
	IsMajorHub  bool   `json:"is_major_hub"`
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
	{Code: "BPL", Name: "Bhopal Junction", City: "Bhopal", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "CNB", Name: "Kanpur Central", City: "Kanpur", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "BLR", Name: "KSR Bengaluru", City: "Bengaluru", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "MAS", Name: "Chennai Central", City: "Chennai", Country: "IN", Type: "railway_station", IsMajorHub: true},
	{Code: "DEL", Name: "Indira Gandhi International Airport", City: "New Delhi", Country: "IN", Type: "airport", IsMajorHub: true},
	{Code: "BOM_AIR", Name: "Chhatrapati Shivaji International Airport", City: "Mumbai", Country: "IN", Type: "airport", IsMajorHub: true},
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
		// Support GET for testing
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

	// Score offers with the Mathematical Journey Utility function
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

func handleSegmentHacks(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	origin := r.URL.Query().Get("origin")
	dest := r.URL.Query().Get("destination")
	if origin == "" {
		origin = "ET"
	}
	if dest == "" {
		dest = "PRYJ"
	}

	hacks := []routes.SegmentHack{
		{
			Type:            "UPSTREAM_BOOKING_WITH_BOARDING_CHANGE",
			TrainNumber:     "11059 (Godan Express)",
			BookFrom:        "BSL (Bhusaval)",
			BoardAt:         "ET (Itarsi)",
			BookTo:          "PRYJ (Prayagraj)",
			ClassCode:       "3A",
			Status:          "AVAILABLE",
			AvailableBerths: 14,
			ExtraFareINR:    195.00,
			Explanation:     "Direct Itarsi->Prayagraj is WL 78. But seats are OPEN from Bhusaval under General Quota! Book from Bhusaval and set Boarding Point to Itarsi. Total extra cost is just ₹195 for a confirmed berth.",
		},
		{
			Type:            "SAME_TRAIN_INTERNAL_SPLIT",
			TrainNumber:     "12155 (Shaan-e-Bhopal)",
			BookFrom:        "ET (Itarsi)",
			BoardAt:         "ET (Itarsi)",
			BookTo:          "PRYJ (Prayagraj via JBP)",
			ClassCode:       "3A",
			Status:          "AVAILABLE",
			AvailableBerths: 8,
			ExtraFareINR:    45.00,
			Explanation:     "Split booking on the exact same train: Leg 1 ET->JBP (Berth B2-24) + Leg 2 JBP->PRYJ (Berth B3-11). Switch berth at Jabalpur without getting off.",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"origin":      origin,
		"destination": dest,
		"hacks":       hacks,
	})
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

func handleAlerts(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method == "POST" {
		var payload map[string]interface{}
		json.NewDecoder(r.Body).Decode(&payload)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"alert_id":              fmt.Sprintf("alt_%d", time.Now().Unix()),
			"status":                "ACTIVE",
			"poll_interval_seconds": 60,
			"message":               "Monitoring active! You will be alerted via WhatsApp as soon as bookable seats open.",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ready",
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
	mux.HandleFunc("/v1/journeys/hacks", handleSegmentHacks)
	mux.HandleFunc("/v1/journeys/alternatives", handleConnectingRoutes)
	mux.HandleFunc("/v1/alerts", handleAlerts)

	port := "8080"
	log.Printf("🚀 Tiktiki API Server running at http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %s", err)
	}
}
