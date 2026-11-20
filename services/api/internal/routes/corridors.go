package routes

import (
	"tik-tiki/services/api/internal/timetable"
)

// RealCorridorTrain aliases the decoupled timetable domain model
type RealCorridorTrain = timetable.RealCorridorTrain

// TrainStop aliases the timetable train stop model
type TrainStop = timetable.TrainStop

// MasterCorridors dynamically references all trains indexed in the timetable database
var MasterCorridors = timetable.GetGlobalStore().GetAllTrains()

// StationMatchesGroup checks if a station stop code matches a query station code or its metropolitan aliases
func StationMatchesGroup(stopCode, queryCode string) bool {
	return timetable.GetGlobalStore().StationMatchesGroup(stopCode, queryCode)
}

// FindAllTrainsBetweenStations searches decoupled timetable store for trains serving both stations
func FindAllTrainsBetweenStations(originCode, destCode string) []RealCorridorTrain {
	return timetable.GetGlobalStore().FindAllTrainsBetweenStations(originCode, destCode)
}

// GetRouteStopsForTrain returns the full ordered stop sequence for any corridor train
func GetRouteStopsForTrain(trainNumber string) []TrainStop {
	return timetable.GetGlobalStore().GetRouteStopsForTrain(trainNumber)
}
