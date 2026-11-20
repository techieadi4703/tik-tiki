package routes

import (
	"testing"
)

func TestCalculateRiskScore(t *testing.T) {
	tests := []struct {
		name               string
		bufferMins         int
		p95DelayMins       int
		expectedRiskMax    float64
		expectedRiskMin    float64
		expectedRiskGrade  string
	}{
		{
			name:              "Extremely safe connection with ample slack",
			bufferMins:        180,
			p95DelayMins:      30, // Slack = 150 mins >= 60
			expectedRiskMax:   5.0,
			expectedRiskMin:   1.0,
			expectedRiskGrade: "SAFE",
		},
		{
			name:              "Boundary safe connection with exactly 60m slack",
			bufferMins:        90,
			p95DelayMins:      30, // Slack = 60 mins >= 60
			expectedRiskMax:   5.0,
			expectedRiskMin:   1.0,
			expectedRiskGrade: "SAFE",
		},
		{
			name:              "Moderate connection with 40m slack",
			bufferMins:        80,
			p95DelayMins:      40, // Slack = 40 mins (30 <= slack < 60)
			expectedRiskMax:   20.0,
			expectedRiskMin:   10.0,
			expectedRiskGrade: "SAFE",
		},
		{
			name:              "Tight connection with 15m slack",
			bufferMins:        60,
			p95DelayMins:      45, // Slack = 15 mins (0 <= slack < 30)
			expectedRiskMax:   45.0,
			expectedRiskMin:   30.0,
			expectedRiskGrade: "MODERATE",
		},
		{
			name:              "Negative slack where delay exceeds buffer",
			bufferMins:        45,
			p95DelayMins:      60, // Slack = -15 mins (< 0)
			expectedRiskMax:   100.0,
			expectedRiskMin:   80.0,
			expectedRiskGrade: "HIGH_RISK",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			risk, grade := CalculateRiskScore(tt.bufferMins, tt.p95DelayMins)

			if risk < tt.expectedRiskMin || risk > tt.expectedRiskMax {
				t.Errorf("got risk score %.2f, expected between %.2f and %.2f", risk, tt.expectedRiskMin, tt.expectedRiskMax)
			}

			if grade != tt.expectedRiskGrade {
				t.Errorf("got risk grade %s, expected %s", grade, tt.expectedRiskGrade)
			}
		})
	}
}
