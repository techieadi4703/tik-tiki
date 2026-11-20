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

	t.Run("GET /v1/journeys/optimize returns all 3 unified optimization strategies", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/v1/journeys/optimize?origin=ET&destination=PRYJ&class=3A", nil)
		w := httptest.NewRecorder()
		handleOptimizeJourneys(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}

		var resp map[string]interface{}
		json.NewDecoder(w.Body).Decode(&resp)

		// 1. Check Upstream Options (Strategy 1)
		upstreamOpts, ok := resp["upstream_options"].([]interface{})
		if !ok || len(upstreamOpts) == 0 {
			t.Fatalf("expected upstream options in optimize response, got %v", resp["upstream_options"])
		}
		firstUpstream := upstreamOpts[0].(map[string]interface{})
		if firstUpstream["type"] != "UPSTREAM_BOOKING" {
			t.Errorf("expected type UPSTREAM_BOOKING, got %v", firstUpstream["type"])
		}

		// 2. Check Delay-Aware Connecting Options (Strategy 2)
		connectingOpts, ok := resp["connecting_options"].([]interface{})
		if !ok || len(connectingOpts) == 0 {
			t.Fatalf("expected connecting options, got %v", resp["connecting_options"])
		}
		firstConnecting := connectingOpts[0].(map[string]interface{})
		if firstConnecting["risk_grade"] != "SAFE" {
			t.Errorf("expected SAFE risk grade for connecting train, got %v", firstConnecting["risk_grade"])
		}

		// 3. Check Split Segment Options (Strategy 3)
		splitOpts, ok := resp["split_segment_options"].([]interface{})
		if !ok || len(splitOpts) == 0 {
			t.Fatalf("expected split segment options, got %v", resp["split_segment_options"])
		}
		firstSplit := splitOpts[0].(map[string]interface{})
		if firstSplit["type"] != "SPLIT_SEGMENT_EXPERIMENTAL" {
			t.Errorf("expected SPLIT_SEGMENT_EXPERIMENTAL, got %v", firstSplit["type"])
		}
	})

	t.Run("POST /v1/alerts creates active WhatsApp subscription with phone validation", func(t *testing.T) {
		validBody := strings.NewReader(`{
			"service_number": "11059",
			"origin": "ET",
			"destination": "PRYJ",
			"departure_date": "2026-12-24",
			"notification_channel": "WHATSAPP",
			"phone_number": "+919876543210"
		}`)
		req := httptest.NewRequest("POST", "/v1/alerts", validBody)
		w := httptest.NewRecorder()
		handleAlerts(w, req)

		if w.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", w.Code, w.Body.String())
		}

		var resp map[string]interface{}
		json.NewDecoder(w.Body).Decode(&resp)
		if resp["status"] != "ACTIVE" || resp["recipient"] != "+919876543210" {
			t.Errorf("expected active alert for phone +919876543210, got %v", resp)
		}
	})
}
