package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestServerEndpoints_TDD(t *testing.T) {
	t.Run("Locations autocomplete with case insensitivity", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/v1/locations/search?q=DELHI", nil)
		w := httptest.NewRecorder()
		handleLocations(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}

		var resp map[string]interface{}
		json.NewDecoder(w.Body).Decode(&resp)
		results := resp["results"].([]interface{})
		if len(results) == 0 {
			t.Errorf("expected locations for 'DELHI', got 0")
		}
	})

	t.Run("CORS preflight OPTIONS request returns 200 with headers", func(t *testing.T) {
		req := httptest.NewRequest("OPTIONS", "/v1/journeys/search", nil)
		w := httptest.NewRecorder()
		handleSearch(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 for OPTIONS, got %d", w.Code)
		}

		corsHeader := w.Header().Get("Access-Control-Allow-Origin")
		if corsHeader != "*" {
			t.Errorf("expected Access-Control-Allow-Origin: *, got '%s'", corsHeader)
		}
	})

	t.Run("POST /v1/journeys/search with valid payload", func(t *testing.T) {
		body := strings.NewReader(`{
			"origin_code": "BOM",
			"dest_code": "JAI",
			"currency": "INR"
		}`)
		req := httptest.NewRequest("POST", "/v1/journeys/search", body)
		w := httptest.NewRecorder()
		handleSearch(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}

		var resp map[string]interface{}
		json.NewDecoder(w.Body).Decode(&resp)
		if resp["origin"] != "BOM" || resp["destination"] != "JAI" {
			t.Errorf("expected origin BOM and destination JAI, got %v and %v", resp["origin"], resp["destination"])
		}
	})

	t.Run("POST /v1/journeys/search with invalid JSON body", func(t *testing.T) {
		badBody := strings.NewReader(`{ invalid json string`)
		req := httptest.NewRequest("POST", "/v1/journeys/search", badBody)
		w := httptest.NewRecorder()
		handleSearch(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d", w.Code)
		}
	})

	t.Run("Segment hacks handler returns actionable hacks", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/v1/journeys/hacks?origin=ET&destination=PRYJ", nil)
		w := httptest.NewRecorder()
		handleSegmentHacks(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}

		var resp map[string]interface{}
		json.NewDecoder(w.Body).Decode(&resp)
		hacks := resp["hacks"].([]interface{})
		if len(hacks) == 0 {
			t.Fatalf("expected segment hacks, got 0")
		}

		firstHack := hacks[0].(map[string]interface{})
		if firstHack["type"] != "UPSTREAM_BOOKING_WITH_BOARDING_CHANGE" {
			t.Errorf("expected UPSTREAM_BOOKING_WITH_BOARDING_CHANGE, got %v", firstHack["type"])
		}
	})

	t.Run("Connecting routes handler calculates risk grades", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/v1/journeys/alternatives", nil)
		w := httptest.NewRecorder()
		handleConnectingRoutes(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}

		var resp map[string]interface{}
		json.NewDecoder(w.Body).Decode(&resp)
		routes := resp["routes"].([]interface{})
		if len(routes) == 0 {
			t.Fatalf("expected connecting routes, got 0")
		}

		firstRoute := routes[0].(map[string]interface{})
		grade := firstRoute["risk_grade"].(string)
		if grade != "SAFE" && grade != "MODERATE" && grade != "HIGH_RISK" {
			t.Errorf("unexpected risk grade: %s", grade)
		}
	})

	t.Run("POST /v1/alerts creates active subscription", func(t *testing.T) {
		body := strings.NewReader(`{"service_number": "11059", "origin": "ET", "destination": "PRYJ"}`)
		req := httptest.NewRequest("POST", "/v1/alerts", body)
		w := httptest.NewRecorder()
		handleAlerts(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d", w.Code)
		}

		var resp map[string]interface{}
		json.NewDecoder(w.Body).Decode(&resp)
		if resp["status"] != "ACTIVE" {
			t.Errorf("expected status ACTIVE, got %v", resp["status"])
		}
	})
}
