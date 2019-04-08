package common

type SdkProvider interface {
	NewKind(description CoreDescription) KindBuilder
	Version(version ProviderVersion)
	Power(power ProviderPower) ProviderPower
}

type Context interface {
	updateStatus(metadata Metadata, status Status) bool
	updateProgress(message string, donePercent int) bool

	urlFor(entity *Entity) string
}
