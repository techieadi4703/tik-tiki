package auth

import (
	"testing"
)

func TestAuthManager_RegisterAndLogin(t *testing.T) {
	mgr := NewAuthManager()

	t.Run("Login with seeded default account", func(t *testing.T) {
		u, token, err := mgr.Login("aditya@tiktiki.in", "railway2026")
		if err != nil {
			t.Fatalf("expected login success, got error: %v", err)
		}
		if u.IRCTCUsername != "ADITYA_CRIS" {
			t.Errorf("expected IRCTC ADITYA_CRIS, got %s", u.IRCTCUsername)
		}
		if token == "" {
			t.Errorf("expected valid session token")
		}

		// Validate token
		validatedUser, err := mgr.ValidateToken(token)
		if err != nil {
			t.Fatalf("token validation failed: %v", err)
		}
		if validatedUser.ID != u.ID {
			t.Errorf("expected user ID %s, got %s", u.ID, validatedUser.ID)
		}
	})

	t.Run("Login with IRCTC username identifier", func(t *testing.T) {
		u, token, err := mgr.Login("ADITYA_CRIS", "railway2026")
		if err != nil {
			t.Fatalf("expected IRCTC ID login success, got error: %v", err)
		}
		if u.Email != "aditya@tiktiki.in" {
			t.Errorf("expected email aditya@tiktiki.in, got %s", u.Email)
		}
		if token == "" {
			t.Errorf("expected valid token")
		}
	})

	t.Run("Register new user and authenticate", func(t *testing.T) {
		u, token, err := mgr.Register("Sneha Sharma", "sneha@example.com", "snehaPass123", "SNEHA_IRCTC", "+919876500000")
		if err != nil {
			t.Fatalf("expected registration success, got: %v", err)
		}
		if u.Name != "Sneha Sharma" {
			t.Errorf("expected Sneha Sharma, got %s", u.Name)
		}

		// Login with new credentials
		loggedInUser, loggedToken, err := mgr.Login("sneha@example.com", "snehaPass123")
		if err != nil {
			t.Fatalf("expected login success, got: %v", err)
		}
		if loggedInUser.ID != u.ID {
			t.Errorf("expected matching user IDs")
		}
		if loggedToken == "" {
			t.Errorf("expected non-empty login token")
		}
		if token == "" {
			t.Errorf("expected valid reg token")
		}
	})

	t.Run("Rejects duplicate email registration", func(t *testing.T) {
		_, _, err := mgr.Register("Duplicate", "aditya@tiktiki.in", "pass12345", "DUP_IRCTC", "")
		if err == nil {
			t.Fatalf("expected error on duplicate email, got nil")
		}
	})

	t.Run("Rejects incorrect password", func(t *testing.T) {
		_, _, err := mgr.Login("aditya@tiktiki.in", "wrongPassword")
		if err == nil {
			t.Fatalf("expected error on wrong password, got nil")
		}
	})

	t.Run("Logout revokes session token", func(t *testing.T) {
		_, token, _ := mgr.Login("aditya@tiktiki.in", "railway2026")
		mgr.Logout(token)

		_, err := mgr.ValidateToken(token)
		if err == nil {
			t.Fatalf("expected token validation error after logout, got nil")
		}
	})
}
