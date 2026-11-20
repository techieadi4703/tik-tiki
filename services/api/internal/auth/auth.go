package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
)

// User represents an authenticated traveler account
type User struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	PasswordHash  string    `json:"-"`
	IRCTCUsername string    `json:"irctc_username"`
	Role          string    `json:"role"` // TRAVELER, AGENT, ADMIN
	Phone         string    `json:"phone,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// Session represents an active authorization token
type Session struct {
	Token     string    `json:"token"`
	UserID    string    `json:"user_id"`
	ExpiresAt time.Time `json:"expires_at"`
}

// AuthManager manages user registration, authentication, sessions, and authorization
type AuthManager struct {
	mu       sync.RWMutex
	users    map[string]*User    // userID -> User
	byEmail  map[string]string   // email -> userID
	byIRCTC  map[string]string   // irctcUsername -> userID
	sessions map[string]*Session // token -> Session
}

// NewAuthManager initializes auth state and seeds default demo accounts
func NewAuthManager() *AuthManager {
	mgr := &AuthManager{
		users:    make(map[string]*User),
		byEmail:  make(map[string]string),
		byIRCTC:  make(map[string]string),
		sessions: make(map[string]*Session),
	}

	// Seed standard verified traveler account
	mgr.seedUser("usr_aditya", "Aditya Srivastava", "aditya@tiktiki.in", "railway2026", "ADITYA_CRIS", "+919876543210", "TRAVELER")
	mgr.seedUser("usr_demo", "Verified IRCTC Traveler", "demo@irctc.co.in", "irctc123", "DEMO_PASSENGER", "+919811223344", "TRAVELER")
	mgr.seedUser("usr_admin", "IRCTC Operations Admin", "admin@tiktiki.in", "admin2026", "RAIL_ADMIN", "+919000000000", "ADMIN")

	return mgr
}

func hashPassword(pass string) string {
	h := sha256.Sum256([]byte(pass + "tiktiki_salt_railway_2026"))
	return hex.EncodeToString(h[:])
}

func generateToken() string {
	b := make([]byte, 24)
	rand.Read(b)
	return "atk_" + hex.EncodeToString(b)
}

func (m *AuthManager) seedUser(id, name, email, pass, irctc, phone, role string) {
	u := &User{
		ID:            id,
		Name:          name,
		Email:         strings.ToLower(strings.TrimSpace(email)),
		PasswordHash:  hashPassword(pass),
		IRCTCUsername: strings.ToUpper(strings.TrimSpace(irctc)),
		Role:          role,
		Phone:         phone,
		CreatedAt:     time.Now().UTC(),
	}
	m.users[u.ID] = u
	m.byEmail[u.Email] = u.ID
	if u.IRCTCUsername != "" {
		m.byIRCTC[u.IRCTCUsername] = u.ID
	}
}

// Register creates a new user profile with email and optional IRCTC credential
func (m *AuthManager) Register(name, email, password, irctcUsername, phone string) (*User, string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	if cleanEmail == "" || !strings.Contains(cleanEmail, "@") {
		return nil, "", errors.New("valid email address is required")
	}
	if len(password) < 6 {
		return nil, "", errors.New("password must be at least 6 characters")
	}
	if strings.TrimSpace(name) == "" {
		return nil, "", errors.New("full name is required")
	}

	if _, exists := m.byEmail[cleanEmail]; exists {
		return nil, "", errors.New("an account with this email already exists")
	}

	cleanIRCTC := strings.ToUpper(strings.TrimSpace(irctcUsername))
	if cleanIRCTC != "" {
		if _, exists := m.byIRCTC[cleanIRCTC]; exists {
			return nil, "", errors.New("this IRCTC username is already linked to another account")
		}
	} else {
		cleanIRCTC = fmt.Sprintf("CRIS_%s", strings.ToUpper(cleanEmail[:strings.Index(cleanEmail, "@")]))
	}

	userID := fmt.Sprintf("usr_%d", time.Now().UnixNano())
	u := &User{
		ID:            userID,
		Name:          strings.TrimSpace(name),
		Email:         cleanEmail,
		PasswordHash:  hashPassword(password),
		IRCTCUsername: cleanIRCTC,
		Role:          "TRAVELER",
		Phone:         strings.TrimSpace(phone),
		CreatedAt:     time.Now().UTC(),
	}

	m.users[u.ID] = u
	m.byEmail[cleanEmail] = u.ID
	m.byIRCTC[cleanIRCTC] = u.ID

	token := generateToken()
	m.sessions[token] = &Session{
		Token:     token,
		UserID:    u.ID,
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour),
	}

	return u, token, nil
}

// Login authenticates user by email or IRCTC ID and password
func (m *AuthManager) Login(identifier, password string) (*User, string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	cleanID := strings.TrimSpace(identifier)
	if cleanID == "" || password == "" {
		return nil, "", errors.New("email/IRCTC username and password are required")
	}

	var userID string
	var exists bool

	// Check email
	if userID, exists = m.byEmail[strings.ToLower(cleanID)]; !exists {
		// Check IRCTC username
		if userID, exists = m.byIRCTC[strings.ToUpper(cleanID)]; !exists {
			return nil, "", errors.New("invalid credentials. Account not found.")
		}
	}

	u := m.users[userID]
	if u.PasswordHash != hashPassword(password) {
		return nil, "", errors.New("incorrect password. Please verify your credentials.")
	}

	token := generateToken()
	m.sessions[token] = &Session{
		Token:     token,
		UserID:    u.ID,
		ExpiresAt: time.Now().Add(30 * 24 * time.Hour),
	}

	return u, token, nil
}

// ValidateToken verifies session token and returns active User
func (m *AuthManager) ValidateToken(token string) (*User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	sess, exists := m.sessions[token]
	if !exists {
		return nil, errors.New("unauthorized: invalid session token")
	}

	if time.Now().After(sess.ExpiresAt) {
		return nil, errors.New("unauthorized: session expired")
	}

	u, exists := m.users[sess.UserID]
	if !exists {
		return nil, errors.New("user account not found")
	}

	return u, nil
}

// GetUser retrieves user by ID
func (m *AuthManager) GetUser(userID string) (*User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	u, exists := m.users[userID]
	if !exists {
		return nil, errors.New("user not found")
	}
	return u, nil
}

// Logout revokes session token
func (m *AuthManager) Logout(token string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.sessions, token)
}

// ListUsers returns all registered users (for admin/audit)
func (m *AuthManager) ListUsers() []*User {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var list []*User
	for _, u := range m.users {
		list = append(list, u)
	}
	return list
}
