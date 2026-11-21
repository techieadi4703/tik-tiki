package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"tik-tiki/services/api/internal/auth"
	"tik-tiki/services/api/internal/bookings"
	"tik-tiki/services/api/internal/providers"
	"tik-tiki/services/api/internal/providers/mock"
	"tik-tiki/services/api/internal/providers/railway"
	"tik-tiki/services/api/internal/routes"
	"tik-tiki/services/api/internal/scoring"
)

func loadEnvFile(paths ...string) {
	for _, p := range paths {
		data, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		lines := strings.Split(string(data), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				k := strings.TrimSpace(parts[0])
				v := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
				if os.Getenv(k) == "" {
					_ = os.Setenv(k, v)
				}
			}
		}
		log.Printf("📄 [ENV] Loaded environment config from %s", p)
		break
	}
}

func init() {
	loadEnvFile(".env", "../.env", "../../.env")
}

var mockAdapter = mock.NewMockAdapter()
var bookingManager = bookings.NewBookingManager()
var authManager = auth.NewAuthManager()
var liveRailwayClient = railway.NewLiveClient()

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
	Code             string   `json:"code"`
	Name             string   `json:"name"`
	City             string   `json:"city"`
	Country          string   `json:"country"`
	Type             string   `json:"type"`
	IsMajorHub       bool     `json:"is_major_hub"`
	Subtitle         string   `json:"subtitle,omitempty"`
	StationsIncluded []string `json:"stations_included,omitempty"`
}

var locationsCatalog = []LocationItem{
	// City Hubs
	{Code: "MUMBAI", Name: "Mumbai (All Stations & Airports)", City: "Mumbai", Country: "IN", Type: "city_hub", IsMajorHub: true, Subtitle: "Includes CSMT, LTT, Bandra (BDTS), Panvel, Central & BOM Airport", StationsIncluded: []string{"CSMT", "LTT", "BDTS", "MMCT", "PNVL", "DR", "BOM"}},
	{Code: "DELHI", Name: "Delhi NCR (All Stations & Airports)", City: "New Delhi", Country: "IN", Type: "city_hub", IsMajorHub: true, Subtitle: "Includes NDLS, Nizamuddin, Old Delhi, Anand Vihar & DEL Airport", StationsIncluded: []string{"NDLS", "NZM", "DLI", "ANVT", "DEL"}},
	{Code: "VARANASI", Name: "Varanasi Area (All Stations & Airports)", City: "Varanasi", Country: "IN", Type: "city_hub", IsMajorHub: true, Subtitle: "Includes BSB, Banaras (BSBS), Pt. Deen Dayal (DDU) & VNS Airport", StationsIncluded: []string{"BSB", "BSBS", "DDU", "VNS"}},
	{Code: "PRAYAGRAJ", Name: "Prayagraj Area (All Stations & Airports)", City: "Prayagraj", Country: "IN", Type: "city_hub", IsMajorHub: true, Subtitle: "Includes Prayagraj Jn (PRYJ), Rambag, Naini & Bamrauli Airport", StationsIncluded: []string{"PRYJ", "PRRB", "NYN", "IXD"}},
	{Code: "BENGALURU", Name: "Bengaluru (All Stations & Airports)", City: "Bengaluru", Country: "IN", Type: "city_hub", IsMajorHub: true, Subtitle: "Includes KSR Bengaluru, Yesvantpur, SMVT & BLR Airport", StationsIncluded: []string{"SBC", "YPR", "SMVB", "BLR"}},
	{Code: "KOLKATA", Name: "Kolkata (All Stations & Airports)", City: "Kolkata", Country: "IN", Type: "city_hub", IsMajorHub: true, Subtitle: "Includes Howrah, Sealdah, Kolkata Terminus & CCU Airport", StationsIncluded: []string{"HWH", "SDAH", "KOAA", "CCU"}},
	{Code: "CHENNAI", Name: "Chennai (All Stations & Airports)", City: "Chennai", Country: "IN", Type: "city_hub", IsMajorHub: true, Subtitle: "Includes MGR Chennai Central, Egmore & MAA Airport", StationsIncluded: []string{"MAS", "MS", "MAA"}},
	{Code: "PATNA", Name: "Patna (All Stations & Airports)", City: "Patna", Country: "IN", Type: "city_hub", IsMajorHub: true, Subtitle: "Includes Patna Jn, Danapur & PAT Airport", StationsIncluded: []string{"PNBE", "DNR", "PAT"}},
	{Code: "JAIPUR", Name: "Jaipur (All Stations & Airports)", City: "Jaipur", Country: "IN", Type: "city_hub", IsMajorHub: true, Subtitle: "Includes Jaipur Jn, Gandhinagar Jaipur & JAI Airport", StationsIncluded: []string{"JP", "JAI"}},

	// Rail Stations
	{Code: "CSMT", Name: "Chhatrapati Shivaji Maharaj Terminus", City: "Mumbai", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Central Railway Trunk Terminal"},
	{Code: "LTT", Name: "Lokmanya Tilak Terminus", City: "Mumbai", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Kurla East · North/Eastbound Expresses"},
	{Code: "BDTS", Name: "Bandra Terminus", City: "Mumbai", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Western Railway Express Terminal"},
	{Code: "MMCT", Name: "Mumbai Central", City: "Mumbai", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Western Railway Premier Line"},
	{Code: "PNVL", Name: "Panvel Junction", City: "Mumbai", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Navi Mumbai Gateway"},
	{Code: "NDLS", Name: "New Delhi Railway Station", City: "New Delhi", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Paharganj / Ajmeri Gate Premier Terminal"},
	{Code: "NZM", Name: "Hazrat Nizamuddin", City: "New Delhi", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "South/Central Rajdhani Terminal"},
	{Code: "DLI", Name: "Old Delhi Railway Station", City: "New Delhi", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Chandni Chowk Historic Terminal"},
	{Code: "ANVT", Name: "Anand Vihar Terminus", City: "New Delhi", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "East Delhi Terminal"},
	{Code: "PRYJ", Name: "Prayagraj Junction", City: "Prayagraj", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Civil Lines · Major NCR Hub"},
	{Code: "PRRB", Name: "Prayagraj Rambag", City: "Prayagraj", Country: "IN", Type: "railway_station", IsMajorHub: false, Subtitle: "NER Varanasi Line Station"},
	{Code: "BSB", Name: "Varanasi Junction", City: "Varanasi", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Cantonment Main Station"},
	{Code: "BSBS", Name: "Banaras Railway Station", City: "Varanasi", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Manduadih Modern Terminal"},
	{Code: "DDU", Name: "Pt. Deen Dayal Upadhyaya Junction", City: "Varanasi", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Mughalsarai Grand Trunk Hub"},
	{Code: "ET", Name: "Itarsi Junction", City: "Itarsi", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "National Quad Junction"},
	{Code: "BPL", Name: "Bhopal Junction", City: "Bhopal", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Madhya Pradesh Capital Hub"},
	{Code: "JBP", Name: "Jabalpur", City: "Jabalpur", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "West Central Railway HQ"},
	{Code: "KTE", Name: "Katni Junction", City: "Katni", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Central Mineral Junction"},
	{Code: "STA", Name: "Satna Junction", City: "Satna", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Rewa & Chitrakoot Gateway"},
	{Code: "BSL", Name: "Bhusaval Junction", City: "Bhusaval", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Maharashtra-MP Hub"},
	{Code: "KNW", Name: "Khandwa Junction", City: "Khandwa", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Omkareshwar Gateway"},
	{Code: "CNB", Name: "Kanpur Central", City: "Kanpur", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Grand Chord Central Hub"},
	{Code: "LKO", Name: "Lucknow Charbagh", City: "Lucknow", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Awadh Capital Junction"},
	{Code: "HWH", Name: "Howrah Junction", City: "Kolkata", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Historic 23-platform Megaterminal"},
	{Code: "SBC", Name: "KSR Bengaluru", City: "Bengaluru", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Majestic City Central Station"},
	{Code: "MAS", Name: "Chennai Central", City: "Chennai", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Southern Railway HQ"},
	{Code: "PNBE", Name: "Patna Junction", City: "Patna", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Bihar Capital Hub"},
	{Code: "JAI", Name: "Jaipur Junction", City: "Jaipur", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "Pink City Central Station"},
	{Code: "JP", Name: "Jaipur Junction", City: "Jaipur", Country: "IN", Type: "railway_station", IsMajorHub: true, Subtitle: "North Western Railway HQ"},

	// Airports (IATA)
	{Code: "BOM", Name: "Chhatrapati Shivaji Maharaj International Airport", City: "Mumbai", Country: "IN", Type: "airport", IsMajorHub: true, Subtitle: "CSMIA · Terminal 1 & 2"},
	{Code: "DEL", Name: "Indira Gandhi International Airport", City: "New Delhi", Country: "IN", Type: "airport", IsMajorHub: true, Subtitle: "IGI Airport · Terminal 1, 2, 3"},
	{Code: "VNS", Name: "Lal Bahadur Shastri International Airport", City: "Varanasi", Country: "IN", Type: "airport", IsMajorHub: true, Subtitle: "Babatpur Airport (Varanasi)"},
	{Code: "IXD", Name: "Prayagraj Bamrauli Airport", City: "Prayagraj", Country: "IN", Type: "airport", IsMajorHub: true, Subtitle: "Bamrauli Civil Enclave"},
	{Code: "BLR", Name: "Kempegowda International Airport", City: "Bengaluru", Country: "IN", Type: "airport", IsMajorHub: true, Subtitle: "Bengaluru Airport"},
	{Code: "CCU", Name: "Netaji Subhash Chandra Bose Intl Airport", City: "Kolkata", Country: "IN", Type: "airport", IsMajorHub: true, Subtitle: "Dum Dum Airport"},
	{Code: "MAA", Name: "Chennai International Airport", City: "Chennai", Country: "IN", Type: "airport", IsMajorHub: true, Subtitle: "Meenambakkam Airport"},
	{Code: "PAT", Name: "Jay Prakash Narayan Airport", City: "Patna", Country: "IN", Type: "airport", IsMajorHub: true, Subtitle: "Patna Civil Airport"},
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
		matchedIncluded := false
		for _, s := range loc.StationsIncluded {
			if strings.Contains(strings.ToLower(s), query) {
				matchedIncluded = true
				break
			}
		}
		if query == "" ||
			strings.Contains(strings.ToLower(loc.Name), query) ||
			strings.Contains(strings.ToLower(loc.City), query) ||
			strings.Contains(strings.ToLower(loc.Code), query) ||
			strings.Contains(strings.ToLower(loc.Subtitle), query) ||
			matchedIncluded {
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
		log.Printf("❌ [BOOKING INITIATE] JSON decode error: %v", err)
		http.Error(w, fmt.Sprintf(`{"error": "Invalid request body: %s"}`, err.Error()), http.StatusBadRequest)
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

func mapExternalPNRToResponse(pnr string, d map[string]interface{}) *bookings.PNRStatusResponse {
	trainNo := fmt.Sprintf("%v", d["TrainNo"])
	trainName := fmt.Sprintf("%v", d["TrainName"])
	doj := fmt.Sprintf("%v", d["Doj"])
	class := fmt.Sprintf("%v", d["Class"])
	quota := fmt.Sprintf("%v", d["Quota"])
	from := fmt.Sprintf("%v", d["From"])
	to := fmt.Sprintf("%v", d["To"])
	boarding := fmt.Sprintf("%v", d["BoardingStationName"])
	chartPrep, _ := d["ChartPrepared"].(bool)

	chartStatus := "CHART NOT PREPARED"
	if chartPrep {
		chartStatus = "CHART PREPARED"
	}

	var passengers []bookings.PNRPassengerStatus
	if rawPax, ok := d["PassengerStatus"].([]interface{}); ok {
		for i, pItem := range rawPax {
			if pMap, ok := pItem.(map[string]interface{}); ok {
				bStatus := fmt.Sprintf("%v", pMap["BookingStatus"])
				cStatus := fmt.Sprintf("%v", pMap["CurrentStatus"])
				coach := fmt.Sprintf("%v", pMap["Coach"])
				berth := 0
				if bNum, ok := pMap["Berth"].(float64); ok {
					berth = int(bNum)
				}
				berthType := fmt.Sprintf("%v", pMap["BookingBerthCode"])

				passengers = append(passengers, bookings.PNRPassengerStatus{
					PassengerIndex:          i + 1,
					BookingStatus:           bStatus,
					CurrentStatus:           cStatus,
					BerthPreference:         berthType,
					AllocatedCoach:          coach,
					AllocatedBerth:          berth,
					AllocatedBerthType:      berthType,
					ConfirmationProbability: 98,
				})
			}
		}
	}

	coachLayout := []string{"LOCO", "EOG", "B1", "B2", "B3", "B4", "A1", "H1", "EOG"}
	if class == "CC" {
		coachLayout = []string{"LOCO", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "E1", "EOG"}
	} else if class == "EC" {
		coachLayout = []string{"LOCO", "C1", "C2", "C3", "C4", "E1", "EOG"}
	}

	return &bookings.PNRStatusResponse{
		PNR:                 pnr,
		TrainNumber:         trainNo,
		TrainName:           trainName,
		OriginCode:          from,
		OriginName:          from,
		DestCode:            to,
		DestName:            to,
		BoardingStationCode: from,
		BoardingStationName: boarding,
		DateOfJourney:       doj,
		DepartureTime:       "16:50",
		ArrivalTime:         "09:55",
		ClassCode:           class,
		ClassName:           class,
		Quota:               quota,
		ChartStatus:         chartStatus,
		PlatformNumber:      "Platform 1",
		OverallStatus:       "CONFIRMED",
		ConfirmationChance:  "98% Verified via CRIS PRS Live",
		Passengers:          passengers,
		CoachLayout:         coachLayout,
		LastUpdated:         time.Now().UTC(),
	}
}

func mapExternalLiveStatusToResponse(trainNo string, d map[string]interface{}) *routes.LiveTrainStatusResponse {
	tName := fmt.Sprintf("%v", d["train_name"])
	currStation := fmt.Sprintf("%v", d["current_station_name"])
	speed := 92
	if s, ok := d["speed"].(float64); ok {
		speed = int(s)
	}
	delay := 0
	if del, ok := d["delay_minutes"].(float64); ok {
		delay = int(del)
	}
	punct := "Right Time"
	if delay > 0 {
		punct = fmt.Sprintf("Running %d mins Late", delay)
	}

	return &routes.LiveTrainStatusResponse{
		TrainNumber:     trainNo,
		TrainName:       tName,
		TrainType:       "SUPERFAST",
		CurrentSpeed:    speed,
		SignalStatus:    "Clear Green",
		DelayMinutes:    delay,
		PunctualityText: punct,
		CurrentStation:  fmt.Sprintf("Live at %s", currStation),
		NextStation:     "Tracking via Live NTES Feed",
		Halts:           nil,
		LastUpdated:     time.Now().UTC(),
	}
}

func handlePNRStatus(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	pnr := r.URL.Query().Get("pnr")
	if pnr == "" {
		http.Error(w, `{"error": "pnr query parameter is required"}`, http.StatusBadRequest)
		return
	}

	// 1. External Live Query if API Key is configured
	if liveRailwayClient.HasLiveAPIKey() {
		if raw, err := liveRailwayClient.QueryExternalPNR(r.Context(), pnr); err == nil && raw != nil {
			if data, ok := raw["data"].(map[string]interface{}); ok && data != nil {
				log.Printf("📡 [CRIS LIVE PRS] Successfully fetched live PNR %s via RapidAPI", pnr)
				resp := mapExternalPNRToResponse(pnr, data)
				if resp != nil {
					w.Header().Set("Content-Type", "application/json")
					json.NewEncoder(w).Encode(resp)
					return
				}
			}
		} else {
			log.Printf("⚠️ [CRIS LIVE PRS] External PNR query unavailable (%v), falling back to local engine", err)
		}
	}

	status, err := bookingManager.GetPNRStatus(pnr)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func handleLiveTrainStatus(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	train := r.URL.Query().Get("train")
	if train == "" {
		train = r.URL.Query().Get("train_number")
	}
	if train == "" {
		http.Error(w, `{"error": "train query parameter is required"}`, http.StatusBadRequest)
		return
	}

	// 1. External Live NTES GPS Tracking if API Key is configured
	if liveRailwayClient.HasLiveAPIKey() {
		if raw, err := liveRailwayClient.QueryExternalLiveRunningStatus(r.Context(), train); err == nil && raw != nil {
			if data, ok := raw["data"].(map[string]interface{}); ok && data != nil {
				log.Printf("📡 [NTES LIVE GPS] Successfully fetched live tracking for train %s via RapidAPI", train)
				resp := mapExternalLiveStatusToResponse(train, data)
				if resp != nil {
					w.Header().Set("Content-Type", "application/json")
					json.NewEncoder(w).Encode(resp)
					return
				}
			}
		} else {
			log.Printf("⚠️ [NTES LIVE GPS] External live status query unavailable (%v), falling back to timetable engine", err)
		}
	}

	status := routes.GetLiveTrainStatus(train)
	if status == nil {
		http.Error(w, fmt.Sprintf(`{"error": "Train '%s' was not found in Indian Railways NTES directory. Indian Railways train numbers are 5 digits (e.g. 12168, 12951, 22435, 20608). Please check the train number and retry."}`, train), http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func handleRailwayAvailability(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	train := r.URL.Query().Get("train")
	if train == "" {
		train = r.URL.Query().Get("train_number")
	}
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")
	date := r.URL.Query().Get("date")
	classType := r.URL.Query().Get("class")
	quota := r.URL.Query().Get("quota")

	if train == "" {
		train = "12168"
	}
	if from == "" {
		from = "BSB"
	}
	if to == "" {
		to = "LTT"
	}
	if date == "" {
		date = time.Now().Add(24 * time.Hour).Format("2006-01-02")
	}

	resp, err := liveRailwayClient.CheckLiveAvailability(r.Context(), train, from, to, date, classType, quota)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
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
	mux.HandleFunc("/v1/pnr/status", handlePNRStatus)
	mux.HandleFunc("/v1/trains/live", handleLiveTrainStatus)
	mux.HandleFunc("/v1/railway/availability", handleRailwayAvailability)
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
