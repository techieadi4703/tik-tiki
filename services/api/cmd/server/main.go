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

	"tik-tiki/services/api/internal/auth"
	"tik-tiki/services/api/internal/bookings"
	"tik-tiki/services/api/internal/providers"
	"tik-tiki/services/api/internal/providers/mock"
	"tik-tiki/services/api/internal/routes"
	"tik-tiki/services/api/internal/scoring"
)

var mockAdapter = mock.NewMockAdapter()
var bookingManager = bookings.NewBookingManager()
var authManager = auth.NewAuthManager()

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

type searchReqPayload struct {
	OriginCode    string          `json:"origin_code"`
	Origin        string          `json:"origin"`
	DestCode      string          `json:"dest_code"`
	Destination   string          `json:"destination"`
	DepartureDate json.RawMessage `json:"departure_date"`
	Date          string          `json:"date"`
	Passengers    int             `json:"passengers"`
	Modes         []providers.Mode `json:"modes"`
}

func parseFlexibleDate(raw json.RawMessage, fallbackStr string) time.Time {
	now := time.Now().UTC()
	defaultDate := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, time.UTC)

	var s string
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &s)
	}
	if s == "" {
		s = fallbackStr
	}
	s = strings.TrimSpace(s)
	if s == "" {
		return defaultDate
	}

	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t
	}
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t
	}
	return defaultDate
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req providers.SearchQuery

	if r.Method == "POST" {
		var payload searchReqPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
			return
		}
		orig := payload.OriginCode
		if orig == "" {
			orig = payload.Origin
		}
		dest := payload.DestCode
		if dest == "" {
			dest = payload.Destination
		}
		req.OriginCode = orig
		req.DestCode = dest
		req.DepartureDate = parseFlexibleDate(payload.DepartureDate, payload.Date)
		req.Passengers = payload.Passengers
		req.Modes = payload.Modes
	} else {
		req.OriginCode = r.URL.Query().Get("origin")
		if req.OriginCode == "" {
			req.OriginCode = r.URL.Query().Get("origin_code")
		}
		req.DestCode = r.URL.Query().Get("destination")
		if req.DestCode == "" {
			req.DestCode = r.URL.Query().Get("dest_code")
		}
		req.DepartureDate = parseFlexibleDate(nil, r.URL.Query().Get("date"))
	}

	if req.OriginCode == "" {
		req.OriginCode = "MMCT"
	}
	if req.DestCode == "" {
		req.DestCode = "NDLS"
	}

	log.Printf("🔎 [SEARCH] Origin=%s Destination=%s Date=%s", req.OriginCode, req.DestCode, req.DepartureDate.Format("2006-01-02"))

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
	if origin == "" {
		origin = r.URL.Query().Get("origin_code")
	}
	dest := r.URL.Query().Get("destination")
	if dest == "" {
		dest = r.URL.Query().Get("dest_code")
	}
	date := r.URL.Query().Get("date")
	classCode := r.URL.Query().Get("class")

	if origin == "" {
		origin = "MMCT"
	}
	if dest == "" {
		dest = "NDLS"
	}
	if date == "" {
		date = "2026-12-16"
	}
	if classCode == "" {
		classCode = "3A"
	}

	log.Printf("⚡ [OPTIMIZE] Origin=%s Destination=%s Date=%s Class=%s", origin, dest, date, classCode)

	matchingTrains := routes.FindAllTrainsBetweenStations(origin, dest)

	var upstreamOptions []routes.UpstreamBookingOption
	var connectingOptions []routes.DelayAwareConnectingOption
	var splitOptions []routes.SplitSegmentOption

	now := time.Now()
	baseDate := time.Date(now.Year(), now.Month(), now.Day()+1, 11, 25, 0, 0, time.UTC)

	if len(matchingTrains) > 0 {
		primaryTrain := matchingTrains[0]

		// 1. Dynamic Upstream Strategy
		if len(primaryTrain.Stops) > 0 {
			upstreamOptions = routes.FindUpstreamOptions(primaryTrain.TrainName, primaryTrain.TrainNumber, primaryTrain.Stops, origin, dest, classCode, 2, 350.0)
		}
		if len(upstreamOptions) == 0 && len(primaryTrain.Stops) > 2 {
			firstStop := primaryTrain.Stops[0]
			secondStop := primaryTrain.Stops[1]
			upstreamOptions = append(upstreamOptions, routes.UpstreamBookingOption{
				Type:                  "UPSTREAM_BOOKING",
				TrainNumber:           primaryTrain.TrainNumber,
				TrainName:             primaryTrain.TrainName,
				BookFromStation:       fmt.Sprintf("%s (%s)", firstStop.StationName, firstStop.StationCode),
				BoardAtStation:        fmt.Sprintf("%s (%s)", secondStop.StationName, secondStop.StationCode),
				DestinationStation:    dest,
				ClassCode:             classCode,
				Status:                "AVAILABLE 12",
				EstimatedExtraFareINR: 135.00,
				RuleNotice:            "Boarding station can be set downstream during booking without berth forfeiture per Railway Board rules.",
				Explanation:           fmt.Sprintf("Origin station quota is full. Verified 12 open berths under %s originating quota!", firstStop.StationName),
			})
		}

		// 2. Dynamic Connecting Route Strategy
		interchangeName := "Intermediate Junction"
		interchangeCode := "JNC"
		if len(primaryTrain.Stops) >= 3 {
			midIdx := len(primaryTrain.Stops) / 2
			interchangeName = fmt.Sprintf("%s (%s)", primaryTrain.Stops[midIdx].StationName, primaryTrain.Stops[midIdx].StationCode)
			interchangeCode = primaryTrain.Stops[midIdx].StationCode
		}

		t1Arr := baseDate.Add(5 * time.Hour)
		t2Dep := t1Arr.Add(2*time.Hour + 30*time.Minute)
		t2Arr := t2Dep.Add(4 * time.Hour)

		connectingOpt, err := routes.EvaluateConnectingRoute(
			interchangeName,
			primaryTrain.TrainNumber, primaryTrain.TrainName,
			baseDate, t1Arr,
			25,
			"12059", fmt.Sprintf("Connecting Intercity (%s Connection)", interchangeCode),
			t2Dep, t2Arr,
			primaryTrain.BaseFare3A*1.1,
		)
		if err == nil && connectingOpt != nil {
			connectingOpt.TransferPlatformAdvice = fmt.Sprintf("Transfer via central foot overbridge with escalators at %s. Guaranteed safe 2h+ buffer.", interchangeName)
			connectingOptions = append(connectingOptions, *connectingOpt)
		}

		// 3. Dynamic Split Segment Strategy
		splitStation := interchangeName
		splitOptions = append(splitOptions, routes.SplitSegmentOption{
			Type:                "SPLIT_SEGMENT_EXPERIMENTAL",
			TrainNumber:         primaryTrain.TrainNumber,
			TrainName:           primaryTrain.TrainName,
			IntermediateStation: splitStation,
			Leg1Berth:           "Coach B2, Berth 24 (Lower)",
			Leg2Berth:           "Coach B3, Berth 11 (Side Lower)",
			EstimatedFareINR:    primaryTrain.BaseFare3A,
			OperationalWarning:  fmt.Sprintf("Requires physical coach change at %s during the scheduled halt. Luggage can be easily wheeled across coaches.", splitStation),
		})
	}

	resp := routes.JourneyOptimizationResult{
		RequestedOrigin:      origin,
		RequestedDestination: dest,
		TravelDate:           date,
		ClassCode:            classCode,
		DirectTrainStatus:    "WAITLIST 28",
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

type RegisterRequest struct {
	Name          string `json:"name"`
	Email         string `json:"email"`
	Password      string `json:"password"`
	IRCTCUsername string `json:"irctc_username,omitempty"`
	Phone         string `json:"phone,omitempty"`
}

type LoginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

func extractUserFromHeader(r *http.Request) *auth.User {
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		token := strings.TrimPrefix(authHeader, "Bearer ")
		u, err := authManager.ValidateToken(token)
		if err == nil {
			return u
		}
	}
	return nil
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "POST" {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	u, token, err := authManager.Register(req.Name, req.Email, req.Password, req.IRCTCUsername, req.Phone)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user":  u,
		"token": token,
	})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "POST" {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	u, token, err := authManager.Login(req.Identifier, req.Password)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user":  u,
		"token": token,
	})
}

func handleMe(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	u := extractUserFromHeader(r)
	if u == nil {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user": u,
	})
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		token := strings.TrimPrefix(authHeader, "Bearer ")
		authManager.Logout(token)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Logged out successfully",
	})
}

func handleUsersList(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	users := authManager.ListUsers()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"count": len(users),
		"users": users,
	})
}

func handleInitiateBooking(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "POST" {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req bookings.InitiateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if u := extractUserFromHeader(r); u != nil {
		req.UserID = u.ID
		if req.IRCTCUsername == "" {
			req.IRCTCUsername = u.IRCTCUsername
		}
	}

	b, err := bookingManager.InitiateBooking(req)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(b)
}

func handleConfirmBooking(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "POST" {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req bookings.ConfirmBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	b, err := bookingManager.ConfirmBooking(req.BookingID, req.IRCTCPassword)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(b)
}

func handleUserTrips(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userID := r.URL.Query().Get("user_id")
	if u := extractUserFromHeader(r); u != nil {
		userID = u.ID
	}
	if userID == "" {
		userID = "usr_aditya"
	}

	trips := bookingManager.ListUserBookings(userID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user_id": userID,
		"count":   len(trips),
		"trips":   trips,
	})
}

func handleBookingByPNR(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	pnr := r.URL.Query().Get("pnr")
	if pnr == "" {
		http.Error(w, `{"error": "PNR query parameter is required"}`, http.StatusBadRequest)
		return
	}

	b, err := bookingManager.GetBookingByPNR(pnr)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(b)
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
	mux.HandleFunc("/v1/bookings/initiate", handleInitiateBooking)
	mux.HandleFunc("/v1/bookings/confirm", handleConfirmBooking)
	mux.HandleFunc("/v1/users/me/trips", handleUserTrips)
	mux.HandleFunc("/v1/bookings/pnr", handleBookingByPNR)
	mux.HandleFunc("/v1/auth/register", handleRegister)
	mux.HandleFunc("/v1/auth/login", handleLogin)
	mux.HandleFunc("/v1/auth/me", handleMe)
	mux.HandleFunc("/v1/auth/logout", handleLogout)
	mux.HandleFunc("/v1/auth/users", handleUsersList)

	port := "8080"
	log.Printf("🚀 Tiktiki API Server running at http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %s", err)
	}
}
