package mock

import (
	"context"
	"testing"
	"time"

	"tik-tiki/services/api/internal/providers"
)

func TestMockAdapterCompliance(t *testing.T) {
	var adapter providers.ProviderAdapter = NewMockAdapter()

	if adapter.Code() != "mock_multimodal" {
		t.Errorf("expected code 'mock_multimodal', got '%s'", adapter.Code())
	}

	if adapter.Category() != providers.ModeMultimodal {
		t.Errorf("expected category 'MULTIMODAL', got '%s'", adapter.Category())
	}

	ctx := context.Background()

	// 1. Test search with no mode filters
	allOffers, err := adapter.Search(ctx, providers.SearchQuery{
		OriginCode: "BOM",
		DestCode:   "JAI",
	})
	if err != nil {
		t.Fatalf("unexpected search error: %v", err)
	}
	if len(allOffers) == 0 {
		t.Errorf("expected non-empty offers, got %d", len(allOffers))
	}

	// 2. Test search with RAIL mode filter only
	railOffers, err := adapter.Search(ctx, providers.SearchQuery{
		OriginCode: "BOM",
		DestCode:   "JAI",
		Modes:      []providers.Mode{providers.ModeRail},
	})
	if err != nil {
		t.Fatalf("unexpected search error: %v", err)
	}
	if len(railOffers) != 2 {
		t.Errorf("expected 2 rail offers, got %d", len(railOffers))
	}
	for _, o := range railOffers {
		if o.Mode != providers.ModeRail {
			t.Errorf("expected only rail mode, got %s", o.Mode)
		}
	}

	// 3. Test check availability
	status, seats, err := adapter.CheckAvailability(ctx, "12955", time.Now(), "3A")
	if err != nil {
		t.Fatalf("unexpected check availability error: %v", err)
	}
	if status != "AVAILABLE" || seats <= 0 {
		t.Errorf("expected AVAILABLE status with seats > 0, got %s with %d seats", status, seats)
	}
}
