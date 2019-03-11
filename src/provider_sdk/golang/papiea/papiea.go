package papiea

type ProviderVersion = string

// Common Intent-Engine structures
type OwnerIdentity struct {
	TenantUuid string `json:"tenant_uuid,omitempty"`
	Owner      string `json:"owner,omitempty"`
}

type PartialReference struct {
	Kind string `json:"kind,omitempty"`
	UUID string `json:"uuid,omitempty"`
}

type BaseReference struct {
	Kind string `json:"kind,omitempty"`
	UUID string `json:"uuid,omitempty"`
	Name string `json:"name,omitempty"`
}

type Metadata struct {
	OwnerIdentity
	BaseReference
	SpecVersion int `json:"spec_version,omitempty"`
}

type Status interface {
	StatusOf() string
}

type Spec interface {
	SpecOf() string
}

type Entity struct {
	Metadata *Metadata `json:"metadata,omitempty"`
	Spec     *Spec     `json:"spec,omitempty"`
	Status   *Status   `json:"status,omitempty"`
}

type ProcedureCallback string

type ProceduralSignature struct {
	Name              string
	Argument          CoreDescription
	Result            CoreDescription
	ExecutionStrategy ExecutionStrategy
	ProcedureCallback
}

type Kind struct {
	Name               string
	NamePlural         *string
	KindStructure      CoreDescription
	IntentfulSignature map[string]string
	DependencyTree     map[string][]string
	Differ             *interface{}
	Procedures         map[string]ProceduralSignature
}

type Provider struct {
	Prefix  string
	Version ProviderVersion
	Kinds   []Kind
}

type CoreDescription interface {
}

type ExecutionStrategy int

const (
	HaltIntentful ExecutionStrategy = 0
)

type ProviderPower int

const (
	On        ProviderPower = 0
	Off       ProviderPower = 1
	Suspended ProviderPower = 2
)
