package common

import (
	"../papiea"
)

type KindBuilder interface {
	Procedure(name string, rbac interface{},
		executionStrategy papiea.ExecutionStrategy,
		inputDesc interface{},
		outputDesc interface{},
		handler func(ctx ProceduralContext, entity papiea.Entity, input interface{}) interface{})
}

type Provider interface {
	NewKind(description papiea.CoreDescription) KindBuilder
	Version(version papiea.ProviderVersion)
	Power(power papiea.ProviderPower) papiea.ProviderPower
}

type IntentfulContext interface {
	updateStatus(metadata papiea.Metadata, status papiea.Status) bool
	updateProgress(message string, donePercent int) bool

	urlFor(entity *papiea.Entity) string
}

type ProceduralContext = IntentfulContext
