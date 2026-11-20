package bookings

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"sync"
	"time"
)

// Passenger represents an individual passenger traveling on the ticket
type Passenger struct {
	FullName        string `json:"full_name"`
	Age             int    `json:"age"`
	Gender          string `json:"gender"`                     // MALE, FEMALE, TRANSGENDER
	BerthPreference string `json:"berth_preference"`           // NO_PREFERENCE, LOWER, MIDDLE, UPPER, SIDE_LOWER, SIDE_UPPER
	SeniorCitizen   bool   `json:"senior_citizen,omitempty"`   // Senior citizen lower berth priority
	FoodPreference  string `json:"food_preference,omitempty"`  // VEG, NON_VEG, NO_FOOD
	BerthAllocated  string `json:"berth_allocated,omitempty"`  // e.g. "Coach B2, Berth 24 (Lower)"
}

// Booking represents a native confirmed or pending railway reservation
type Booking struct {
	ID            string      `json:"id"`
	UserID        string      `json:"user_id"`
	PNR           string      `json:"pnr"`
	TrainNumber   string      `json:"train_number"`
	TrainName     string      `json:"train_name"`
	OriginCode    string      `json:"origin_code"`
	DestCode      string      `json:"dest_code"`
	DepartureAt   time.Time   `json:"departure_at"`
	ArrivalAt     time.Time   `json:"arrival_at"`
	ClassCode     string      `json:"class_code"`
	Quota         string      `json:"quota,omitempty"` // GN, SS, LD, TQ
	Status        string      `json:"status"`          // PENDING_AUTH, CONFIRMED, CANCELLED
	TotalFare     float64     `json:"total_fare"`
	IRCTCUsername string      `json:"irctc_username"`
	CoachNumber   string      `json:"coach_number,omitempty"`
	BerthNumber   int         `json:"berth_number,omitempty"`
	BerthType     string      `json:"berth_type,omitempty"`
	Passengers    []Passenger `json:"passengers"`
	QRCodeData    string      `json:"qr_code_data,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
}

// InitiateBookingRequest payload for starting the reservation process
type InitiateBookingRequest struct {
	UserID        string      `json:"user_id,omitempty"`
	TrainNumber   string      `json:"train_number"`
	TrainName     string      `json:"train_name"`
	OriginCode    string      `json:"origin_code"`
	DestCode      string      `json:"dest_code"`
	DepartureAt   string      `json:"departure_at"`
	ArrivalAt     string      `json:"arrival_at"`
	ClassCode     string      `json:"class_code"`
	Quota         string      `json:"quota,omitempty"`
	TotalFare     float64     `json:"total_fare"`
	IRCTCUsername string      `json:"irctc_username"`
	Passengers    []Passenger `json:"passengers"`
}

// ConfirmBookingRequest payload for IRCTC credential verification and ticket issuance
type ConfirmBookingRequest struct {
	BookingID     string `json:"booking_id"`
	IRCTCUsername string `json:"irctc_username"`
	IRCTCPassword string `json:"irctc_password"`
	AuthMethod    string `json:"auth_method"` // PASSWORD or OTP
}

// BookingManager thread-safe state store for live railway bookings
type BookingManager struct {
	mu       sync.RWMutex
	bookings map[string]*Booking
	pnrIndex map[string]*Booking
}

// NewBookingManager seeds demo bookings for instant passbook demonstration
func NewBookingManager() *BookingManager {
	bm := &BookingManager{
		bookings: make(map[string]*Booking),
		pnrIndex: make(map[string]*Booking),
	}

	// Seed an initial confirmed multi-passenger e-ticket
	samplePNR := "284-9182741"
	dep := time.Now().Add(48 * time.Hour)
	arr := dep.Add(15*time.Hour + 30*time.Minute)

	passengers := []Passenger{
		{
			FullName:        "Aditya Srivastava",
			Age:             26,
			Gender:          "MALE",
			BerthPreference: "LOWER",
			SeniorCitizen:   false,
			FoodPreference:  "VEG",
			BerthAllocated:  "Coach B2, Berth 24 (Lower)",
		},
		{
			FullName:        "Sunita Srivastava",
			Age:             59,
			Gender:          "FEMALE",
			BerthPreference: "LOWER",
			SeniorCitizen:   true,
			FoodPreference:  "VEG",
			BerthAllocated:  "Coach B2, Berth 21 (Lower · Senior Quota)",
		},
	}

	sampleBooking := &Booking{
		ID:            "bk_sample_01",
		UserID:        "usr_demo",
		PNR:           samplePNR,
		TrainNumber:   "12951",
		TrainName:     "Tejas Rajdhani Express",
		OriginCode:    "MMCT",
		DestCode:      "NDLS",
		DepartureAt:   dep,
		ArrivalAt:     arr,
		ClassCode:     "3A",
		Quota:         "GN",
		Status:        "CONFIRMED",
		TotalFare:     5700.00,
		IRCTCUsername: "ADITYA_CRIS",
		CoachNumber:   "B2",
		BerthNumber:   24,
		BerthType:     "LOWER",
		Passengers:    passengers,
		QRCodeData:    fmt.Sprintf("IRCTC:PNR:%s:TRN:12951:COACH:B2:BERTH:24", samplePNR),
		CreatedAt:     time.Now().Add(-2 * time.Hour),
	}

	bm.bookings[sampleBooking.ID] = sampleBooking
	bm.pnrIndex[samplePNR] = sampleBooking

	// Also index for seeded user Aditya
	adityaBooking := *sampleBooking
	adityaBooking.ID = "bk_sample_aditya"
	adityaBooking.UserID = "usr_aditya"
	bm.bookings[adityaBooking.ID] = &adityaBooking

	return bm
}

func generatePNR() string {
	n1, _ := rand.Int(rand.Reader, big.NewInt(899))
	n2, _ := rand.Int(rand.Reader, big.NewInt(8999999))
	return fmt.Sprintf("%03d-%07d", n1.Int64()+100, n2.Int64()+1000000)
}

func (bm *BookingManager) InitiateBooking(req InitiateBookingRequest) (*Booking, error) {
	if req.TrainNumber == "" || req.OriginCode == "" || req.DestCode == "" {
		return nil, errors.New("train_number, origin_code, and dest_code are required")
	}
	if len(req.Passengers) == 0 {
		return nil, errors.New("at least one passenger is required")
	}
	if len(req.Passengers) > 6 {
		return nil, errors.New("maximum 6 passengers allowed per Indian Railways e-ticket")
	}
	if strings.TrimSpace(req.IRCTCUsername) == "" {
		return nil, errors.New("irctc_username is required for Indian Railways booking")
	}

	depTime, err := time.Parse(time.RFC3339, req.DepartureAt)
	if err != nil {
		depTime = time.Now().Add(24 * time.Hour)
	}
	arrTime, err := time.Parse(time.RFC3339, req.ArrivalAt)
	if err != nil {
		arrTime = depTime.Add(12 * time.Hour)
	}

	bookingID := fmt.Sprintf("bk_%d", time.Now().UnixNano())
	targetUserID := req.UserID
	if targetUserID == "" {
		targetUserID = "usr_demo"
	}

	quota := req.Quota
	if quota == "" {
		quota = "GN"
	}

	b := &Booking{
		ID:            bookingID,
		UserID:        targetUserID,
		PNR:           "",
		TrainNumber:   req.TrainNumber,
		TrainName:     req.TrainName,
		OriginCode:    strings.ToUpper(req.OriginCode),
		DestCode:      strings.ToUpper(req.DestCode),
		DepartureAt:   depTime,
		ArrivalAt:     arrTime,
		ClassCode:     req.ClassCode,
		Quota:         quota,
		Status:        "PENDING_AUTH",
		TotalFare:     req.TotalFare,
		IRCTCUsername: req.IRCTCUsername,
		Passengers:    req.Passengers,
		CreatedAt:     time.Now().UTC(),
	}

	bm.mu.Lock()
	bm.bookings[bookingID] = b
	bm.mu.Unlock()

	return b, nil
}

func (bm *BookingManager) ConfirmBooking(bookingID string, password string) (*Booking, error) {
	if strings.TrimSpace(password) == "" {
		return nil, errors.New("valid IRCTC password or authorization token is required")
	}

	bm.mu.Lock()
	defer bm.mu.Unlock()

	b, exists := bm.bookings[bookingID]
	if !exists {
		return nil, errors.New("booking not found")
	}

	// Assign coach based on class
	pnr := generatePNR()
	coach := "B2"
	if b.ClassCode == "2A" {
		coach = "A1"
	} else if b.ClassCode == "1A" {
		coach = "H1"
	} else if b.ClassCode == "SL" {
		coach = "S4"
	}

	// Allocate realistic berths for each passenger in the manifest
	startBerth := 21
	for i := range b.Passengers {
		berthNum := startBerth + (i * 3) // Cluster around nearby bays
		if berthNum > 72 {
			berthNum = ((berthNum - 1) % 72) + 1
		}

		bType := b.Passengers[i].BerthPreference
		// Senior citizens and women 58+ get lower berth priority in Indian Railways
		if b.Passengers[i].SeniorCitizen || b.Passengers[i].Age >= 60 || (b.Passengers[i].Gender == "FEMALE" && b.Passengers[i].Age >= 58) {
			bType = "LOWER"
		}
		if bType == "" || bType == "NO_PREFERENCE" {
			switch i % 3 {
			case 0:
				bType = "LOWER"
			case 1:
				bType = "MIDDLE"
			case 2:
				bType = "UPPER"
			}
		}

		b.Passengers[i].BerthAllocated = fmt.Sprintf("Coach %s, Berth %d (%s)", coach, berthNum, bType)
	}

	b.PNR = pnr
	b.Status = "CONFIRMED"
	b.CoachNumber = coach
	b.BerthNumber = startBerth
	if len(b.Passengers) > 0 {
		b.BerthType = b.Passengers[0].BerthPreference
	} else {
		b.BerthType = "LOWER"
	}
	b.QRCodeData = fmt.Sprintf("IRCTC:PNR:%s:TRN:%s:COACH:%s:PAX:%d", pnr, b.TrainNumber, coach, len(b.Passengers))

	bm.pnrIndex[pnr] = b
	return b, nil
}

func (bm *BookingManager) ListUserBookings(userID string) []*Booking {
	bm.mu.RLock()
	defer bm.mu.RUnlock()

	var result []*Booking
	for _, b := range bm.bookings {
		if b.UserID == userID || (userID == "usr_aditya" && (b.UserID == "usr_demo" || b.UserID == "usr_aditya")) {
			result = append(result, b)
		}
	}
	return result
}

func (bm *BookingManager) GetBookingByPNR(pnr string) (*Booking, error) {
	bm.mu.RLock()
	defer bm.mu.RUnlock()

	b, exists := bm.pnrIndex[pnr]
	if !exists {
		return nil, errors.New("booking with PNR not found")
	}
	return b, nil
}
