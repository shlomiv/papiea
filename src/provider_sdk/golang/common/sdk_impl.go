package common

import (
	"fmt"
	"github.com/jinzhu/inflection"
	"github.com/pkg/errors"
	"github.com/valyala/fasthttp"
	"gopkg.in/resty.v1"
	"strconv"
)

type ProviderSdk struct {
	Version       *ProviderVersion
	Prefix        *string
	Kinds         []Kind
	Provider      *Provider
	PapieaUrl     string
	PapieaPort    int
	ServerManager ServerManager
}

func MakeSdk(hostParams map[string]string) (*ProviderSdk, error) {
	papieaHost, present := hostParams["papiea_host"]
	if present == false {
		return nil, errors.New("Papiea host is not specified")
	}
	papieaPort, present := hostParams["papiea_port"]
	sdk := ProviderSdk{}
	if present == false {
		if port, err := strconv.Atoi(papieaPort); err != nil {
			sdk.PapieaPort = port
		} else {
			return nil, errors.New("Couldn't interpret papiea port as number")
		}
		return nil, errors.New("Papiea port is not specified")
	}
	sdk.PapieaUrl = papieaHost
	router, routerGroup := makeRouter()
	serverManager := ServerManager{
		"127.0.0.1",
		9000,
		&fasthttp.Server{
			Handler: router.HandleRequest,
		},
		routerGroup,
		false,
	}
	publicHost, hostPresent := hostParams["public_host"]
	publicPort, portPresent := hostParams["public_port"]
	if hostPresent == true && portPresent == true {
		serverManager.publicHost = publicHost
		port, e := strconv.Atoi(publicPort)
		if e != nil {
			return nil, errors.New("Couldn't interpret public port as number")
		}
		serverManager.publicPort = port
	}
	sdk.ServerManager = serverManager
	return &sdk, nil
}

func (sdk *ProviderSdk) NewKind(entityDesc map[interface{}]interface{}) (*KindBuilder, error) {
	if len(entityDesc) == 0 {
		return nil, errors.New("Malformed entity description")
	}
	keys := make([]interface{}, 0)
	for k := range entityDesc {
		keys = append(keys, k)
	}
	if len(keys) != 1 {
		return nil, errors.New("Malformed entity description")
	}
	firstElement := keys[0]
	if item, found := entityDesc[firstElement].(map[interface{}]interface{})["x-papiea-entity"]; found {
		if item == "spec-only" {
			var (
				intentfulSignatures map[string]string
				dependencyTree      map[string][]string
				procedures          map[string]ProceduralSignature
			)
			plural := inflection.Plural(firstElement.(string))
			specOnlyKind := Kind{
				Name:               firstElement.(string),
				NamePlural:         &plural,
				KindStructure:      entityDesc,
				IntentfulSignature: intentfulSignatures,
				DependencyTree:     dependencyTree,
				Procedures:         procedures,
			}
			kindBuilder := KindBuilder{specOnlyKind, sdk.entityUrl(), sdk.Prefix, sdk.ServerManager}
			sdk.Kinds = append(sdk.Kinds, specOnlyKind)
			return &kindBuilder, nil
		} else {
			return nil, errors.New("Unimplemented")
		}
	} else {
		return nil, errors.New("Malformed entity description")
	}
}

func (sdk *ProviderSdk) prefix(prefix string) {
	sdk.Prefix = &prefix
}

func (sdk *ProviderSdk) version(version ProviderVersion) {
	sdk.Version = &version
}

func (sdk ProviderSdk) entityUrl() string {
	return fmt.Sprintf("http://%s:%d/entity", sdk.PapieaUrl, sdk.PapieaPort)
}

func (sdk *ProviderSdk) addKind(kind Kind) *KindBuilder {
	for _, item := range sdk.Kinds {
		if item.Name == kind.Name {
			return nil
		}
	}
	sdk.Kinds = append(sdk.Kinds, kind)
	return &KindBuilder{kind, sdk.entityUrl(), sdk.Prefix, sdk.ServerManager}
}

func (sdk *ProviderSdk) removeKind(kind Kind) bool {
	for i, item := range sdk.Kinds {
		if item.Name == kind.Name {
			sdk.Kinds = append(sdk.Kinds[:i], sdk.Kinds[i:]...)
			return true
		}
	}
	return false
}

func (sdk *ProviderSdk) register() error {
	if len(sdk.Kinds) > 0 && sdk.Prefix != nil && sdk.Version != nil {
		sdk.Provider = &Provider{
			Kinds:   sdk.Kinds,
			Version: *sdk.Version,
			Prefix:  *sdk.Prefix,
		}
		resp, err := resty.SetHostURL(fmt.Sprintf("http://%s:%d", sdk.PapieaUrl, sdk.PapieaPort)).R().SetBody(sdk.Provider).Post("/provider/")
		if err != nil || resp.StatusCode() != 201 {
			return errors.New("Cannot register new provider")
		}
		go func() {
			err = sdk.ServerManager.startServer()
			if err != nil {
				panic(err)
			}
		}()
	} else if sdk.Prefix == nil {
		return errors.New(sdk.providerErrorDescription("prefix"))
	} else if sdk.Version == nil {
		return errors.New(sdk.providerErrorDescription("version"))
	} else {
		return errors.New(sdk.providerErrorDescription("kind"))
	}
	return nil
}

func (sdk ProviderSdk) providerErrorDescription(missingField string) string {
	return fmt.Sprintf("Malformed provider description. Missing: %s", missingField)
}

type IntentfulContext struct {
	BaseUrl string
	Prefix  string
}

func (ctx *IntentfulContext) updateStatus(metadata Metadata, status Status) bool {
	return false
}

func (ctx *IntentfulContext) updateProgress(message string, donePercent int) bool {
	return false
}

func (ctx IntentfulContext) urlFor(entity *Entity) string {
	return fmt.Sprintf("%s/%s/%s/%s", ctx.BaseUrl, ctx.Prefix, entity.Metadata.Kind, entity.Metadata.UUID)
}

type ProceduralContext = IntentfulContext
