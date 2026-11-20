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
	Gender          string `json:"gender"`           // MALE, FEMALE, TRANSGENDER
	BerthPreference string `json:"berth_preference"` // LOWER, MIDDLE, UPPER, SIDE_LOWER, SIDE_UPPER
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
	Status        string      `json:"status"` // PENDING_AUTH, CONFIRMED, CANCELLED
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
	TotalFare     float64     `json:"total_fare"`
	IRCTCUsername string      `json:"irctc_username"`
	Passengers    []Passenger `json:"passengers"`
}

// ConfirmBookingRequest payload for IRCTC credential verification and ticket issuance
type ConfirmBookingRequest struct {
	BookingID     string `json:"booking_id"`
	IRCTCUsername string `json:"irctc_username"`
	IRCTCPassword string `json:"irctc_password"`
	AuthMethod    string `json:"auth_method"` // "PASSWORD" or "OTP"
}

// BookingManager handles in-memory and persistence operations for bookings
type BookingManager struct {
	mu       sync.RWMutex
	bookings map[string]*Booking
	pnrIndex map[string]*Booking
}

func NewBookingManager() *BookingManager {
	bm := &BookingManager{
		bookings: make(map[string]*Booking),
		pnrIndex: make(map[string]*Booking),
	}

	// Seed with an initial sample confirmed trip for demonstration
	now := time.Now()
	samplePNR := "284-9182741"
	depTime := now.Add(48 * time.Hour)
	sampleBooking := &Booking{
		ID:            "bk_sample_01",
		UserID:        "usr_demo",
		PNR:           samplePNR,
		TrainNumber:   "12951",
		TrainName:     "Tejas Rajdhani Express",
		OriginCode:    "MMCT",
		DestCode:      "NDLS",
		DepartureAt:   depTime,
		ArrivalAt:     depTime.Add(15 * time.Hour + 32 * time.Minute),
		ClassCode:     "3A",
		Status:        "CONFIRMED",
		TotalFare:     2850.00,
		IRCTCUsername: "aditya_srivastava",
		CoachNumber:   "B2",
		BerthNumber:   24,
		BerthType:     "LOWER",
		Passengers: []Passenger{
			{FullName: "Aditya Srivastava", Age: 26, Gender: "MALE", BerthPreference: "LOWER"},
		},
		QRCodeData: fmt.Sprintf("IRCTC:PNR:%s:TRN:12951:COACH:B2:BERTH:24", samplePNR),
		CreatedAt:  now.Add(-2 * time.Hour),
	}
	bm.bookings[sampleBooking.ID] = sampleBooking
	bm.pnrIndex[samplePNR] = sampleBooking

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

	// Assign coach, berth, and 10-digit official PNR
	pnr := generatePNR()
	coach := "B2"
	if b.ClassCode == "2A" {
		coach = "A1"
	} else if b.ClassCode == "1A" {
		coach = "H1"
	} else if b.ClassCode == "SL" {
		coach = "S4"
	}

	berthNo := 24
	if len(b.Passengers) > 0 && b.Passengers[0].BerthPreference != "" {
		b.BerthType = b.Passengers[0].BerthPreference
	} else {
		b.BerthType = "LOWER"
	}

	b.PNR = pnr
	b.Status = "CONFIRMED"
	b.CoachNumber = coach
	b.BerthNumber = berthNo
	b.QRCodeData = fmt.Sprintf("IRCTC:PNR:%s:TRN:%s:COACH:%s:BERTH:%d", pnr, b.TrainNumber, coach, berthNo)

	bm.pnrIndex[pnr] = b
	return b, nil
}

func (bm *BookingManager) ListUserBookings(userID string) []*Booking {
	bm.mu.RLock()
	defer bm.mu.RUnlock()

	var result []*Booking
	for _, b := range bm.bookings {
		if b.Status == "CONFIRMED" {
			result = append(result, b)
		}
	}
	return result
}

func (bm *BookingManager) GetBookingByPNR(pnr string) (*Booking, error) {
	bm.mu.RLock()
	defer bm.mu.RUnlock()

	cleanPNR := strings.TrimSpace(pnr)
	b, exists := bm.pnrIndex[cleanPNR]
	if !exists {
		return nil, errors.New("booking with specified PNR not found")
	}
	return b, nil
}
