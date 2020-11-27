import enum
from dataclasses import dataclass
from typing import Any, Optional, Dict, Union, List


class AttributeDict(dict):
    __getattr__ = dict.__getitem__
    __setattr__ = dict.__setitem__


Version = str
Secret = str
DataDescription = Any
SFS = str
ProviderCallbackUrl = str


class ProceduralExecutionStrategy(str):
    HaltIntentful = 0


class IntentfulExecutionStrategy(int):
    Basic = 0


@dataclass
class ProceduralSignature:
    name: str
    argument: DataDescription
    result: DataDescription
    execution_strategy: Union[ProceduralExecutionStrategy, IntentfulExecutionStrategy]
    procedure_callback: ProviderCallbackUrl
    base_callback: ProviderCallbackUrl
    description: Optional[str] = None
    errors_schemas: Optional['ErrorSchemas'] = None


# Cannot inherit this because of
# non-default arguments follows default argument, waiting for Python to work around this MRO inconvenience
@dataclass
class IntentfulSignature:
    name: str
    argument: DataDescription
    result: DataDescription
    execution_strategy: Union[ProceduralExecutionStrategy, IntentfulExecutionStrategy]
    procedure_callback: ProviderCallbackUrl
    base_callback: ProviderCallbackUrl
    signature: SFS
    description: Optional[str] = None
    errors_schemas: Optional['ErrorSchemas'] = None


@dataclass
class S2SKey:
    owner: str
    provider_prefix: str
    key: Secret
    uuid: str
    created_at: Any
    deleted_at: Any
    user_info: 'UserInfo'
    name: Optional[str] = None


UserInfo = Dict[str, Any]


@dataclass
class Entity:
    metadata: 'Metadata'
    spec: 'Spec'
    status: 'Status'


@dataclass
class EntityReference:
    uuid: str
    kind: str
    name: Optional[str] = None


class ProviderEntityReference(EntityReference):
    provider_prefix: str
    provider_version: Version


Spec = AttributeDict
Status = AttributeDict


@dataclass
class EntitySpec:
    metadata: 'Metadata'
    spec: 'Spec'


class Metadata(ProviderEntityReference):
    spec_version: int
    created_at: Any
    deleted_at: Optional[Any] = None
    extension: Optional[Dict[str, Any]] = None


@dataclass
class DiffContent:
    keys: Any
    key: str
    path: List[Union[str, int]]
    spec: Union[List[int], List[str]]
    status: Union[List[int], List[str]]


@dataclass
class Diff:
    kind: str
    intentful_signature: 'IntentfulSignature'
    diff_fields: List[DiffContent]
    handler_url: Optional[str] = None


@dataclass
class IntentWatcher:
    uuid: str
    entity_ref: ProviderEntityReference
    spec_version: int
    diffs: List[Diff]
    status: 'IntentfulStatus'
    user: Optional[UserInfo] = None
    last_status_changed: Optional[Any] = None
    created_at: Optional[Any] = None


class Action(str):
    Read = "read"
    Update = "write"
    Create = "create"
    Delete = "delete"
    RegisterProvider = "register_provider"
    UnregisterProvider = "unregister_provider"
    ReadProvider = "read_provider"
    UpdateAuth = "update_auth"
    CreateS2SKey = "create_key"
    ReadS2SKey = "read_key"
    InactivateS2SKey = "inactive_key"
    UpdateStatus = "update_status"


@dataclass
class Provider:
    prefix: str
    version: Version
    kinds: List['Kind']
    procedures: Dict[str, ProceduralSignature]
    extension_structure: DataDescription
    allowExtraProps: bool
    created_at: Optional[Any] = None
    policy: Optional[str] = None
    oauth: Optional[str] = None
    authModel: Optional[str] = None


@dataclass
class Kind:
    name: str
    kind_structure: DataDescription
    intentful_behaviour: 'IntentfulBehaviour'
    intentful_signatures: List[IntentfulSignature]
    dependency_tree: Dict[SFS, List[SFS]]
    entity_procedures: Dict[str, ProceduralSignature]
    kind_procedures: Dict[str, ProceduralSignature]
    uuid_validation_pattern: Optional[str] = None
    name_plural: Optional[str] = None
    differ: Optional[Any] = None
    diff_delay: Optional[int] = None
    diff_selection_strategy: Optional['DiffSelectionStrategy'] = None


class PapieaError(enum.Enum):
    Validation = "validation_error"
    BadRequest = "bad_request_error"
    ProcedureInvocation = "procedure_invocation_error"
    EntityNotFound = "entity_not_found_error"
    Unauthorized = "unauthorized_error"
    PermissionDenied = "permission_denied_error"
    ConflictingEntity = "conflicting_entity_error"
    ServerError = "server_error"


class DiffSelectionStrategy(enum.Enum):
    Basic = "basic"
    Random = "random"


class IntentfulBehaviour(str):
    Basic = "basic"
    SpecOnly = "spec-only"
    Differ = "differ"


# Error description in format:
# Map<code, ErrorSchemas> where code is an error status code as string
# ErrorSchemas structure is an OpenAPI object describing error value
# Beware that an Error that user gets in the end is still of
#  a PapieaErrorResponse type
@dataclass
class ErrorSchema:
    description: Optional[str] = None
    structure: Optional[Any] = None


ErrorSchemas = Dict[str, ErrorSchema]


@dataclass
class ProcedureDescription:
    input_schema: Optional[Any] = None  # openapi schema representing input
    output_schema: Optional[Any] = None # openapi schema representing output
    errors_schemas: Optional[ErrorSchemas] = None  # map of error-code to openapi schema representing error
    description: Optional[str] = None # textual description of the procedure


ProviderPower = str
Key = str


class IntentfulStatus(str):
    Pending = "Pending"
    Active = "Active"
    Completed_Successfully = "Completed Successfully"
    Completed_Partially = "Completed Partially"
    Failed = "Failed"
    Outdated = "Outdated"
