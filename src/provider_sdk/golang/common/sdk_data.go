package common

import (
	"../papiea"
)

type Provider interface {
	NewKind(description papiea.CoreDescription) KindBuilder
	Version(version papiea.ProviderVersion)
	Power(power papiea.ProviderPower) papiea.ProviderPower
}

type Context interface {
	updateStatus(metadata papiea.Metadata, status papiea.Status) bool
	updateProgress(message string, donePercent int) bool

	urlFor(entity *papiea.Entity) string
}
