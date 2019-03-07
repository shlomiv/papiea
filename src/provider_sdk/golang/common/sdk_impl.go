package common

import (
	"../papiea"
	"github.com/pkg/errors"
	"github.com/valyala/fasthttp"
	"strconv"
)

type ProviderSdk struct {
	version       *papiea.ProviderVersion
	prefix        *string
	kinds         []papiea.Kind
	provider      *papiea.Provider
	PapieaUrl     string
	PapieaPort    int
	ServerManager ServerManager
}

func makeSdk(hostParams map[string]string) (*ProviderSdk, error) {
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
		if port, err := strconv.Atoi(publicPort); err != nil {
			serverManager.publicPort = port
		} else {
			return nil, errors.New("Couldn't interpret public port as number")
		}
	}
	sdk.ServerManager = serverManager
	return &sdk, nil
}
