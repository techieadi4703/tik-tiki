package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestEndpoints(t *testing.T) {
	// 1. Locations
	reqLoc := httptest.NewRequest("GET", "/v1/locations/search?q=mum", nil)
	wLoc := httptest.NewRecorder()
	handleLocations(wLoc, reqLoc)

	if wLoc.Code != http.StatusOK {
		t.Fatalf("handleLocations returned status %d", wLoc.Code)
	}

	var locResp map[string]interface{}
	json.NewDecoder(wLoc.Body).Decode(&locResp)
	results := locResp["results"].([]interface{})
	if len(results) == 0 {
		t.Errorf("expected autocomplete results for 'mum', got 0")
	}

	// 2. Journey Search
	reqSearch := httptest.NewRequest("GET", "/v1/journeys/search?origin=BOM&destination=JAI", nil)
	wSearch := httptest.NewRecorder()
	handleSearch(wSearch, reqSearch)

	if wSearch.Code != http.StatusOK {
		t.Fatalf("handleSearch returned status %d", wSearch.Code)
	}

	var searchResp map[string]interface{}
	json.NewDecoder(wSearch.Body).Decode(&searchResp)
	offers := searchResp["results"].([]interface{})
	if len(offers) == 0 {
		t.Errorf("expected search results, got 0")
	}

	// Verify that each offer received a Journey Utility Score
	firstOffer := offers[0].(map[string]interface{})
	score, ok := firstOffer["score"].(float64)
	if !ok || score <= 0 {
		t.Errorf("expected valid computed Journey Score, got %v", firstOffer["score"])
	}

	// 3. Segment Hacks (Itarsi -> Prayagraj)
	reqHack := httptest.NewRequest("GET", "/v1/journeys/hacks?origin=ET&destination=PRYJ", nil)
	wHack := httptest.NewRecorder()
	handleSegmentHacks(wHack, reqHack)

	if wHack.Code != http.StatusOK {
		t.Fatalf("handleSegmentHacks returned status %d", wHack.Code)
	}

	var hackResp map[string]interface{}
	json.NewDecoder(wHack.Body).Decode(&hackResp)
	hacks := hackResp["hacks"].([]interface{})
	if len(hacks) == 0 {
		t.Errorf("expected segment hacks, got 0")
	}

	// 4. Alert Creation
	alertBody := strings.NewReader(`{"service_number":"11059","origin":"ET","destination":"PRYJ","departure_date":"2026-12-24"}`)
	reqAlert := httptest.NewRequest("POST", "/v1/alerts", alertBody)
	wAlert := httptest.NewRecorder()
	handleAlerts(wAlert, reqAlert)

	if wAlert.Code != http.StatusCreated {
		t.Fatalf("handleAlerts returned status %d, expected 201", wAlert.Code)
	}
}
