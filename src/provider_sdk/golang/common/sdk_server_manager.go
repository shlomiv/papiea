package common

import (
	"fmt"
	"github.com/qiangxue/fasthttp-routing"
	"github.com/valyala/fasthttp"
	"log"
)

type ServerManager struct {
	publicHost string
	publicPort int
	server     *fasthttp.Server
	routeGroup *routing.RouteGroup
	running    bool
}

func makeRouter() (*routing.Router, *routing.RouteGroup) {
	router := routing.New()

	generalRG := router.Group("/")
	return router, generalRG
}

func (manager *ServerManager) registerHandler(route string, handler routing.Handler) {
	manager.routeGroup.Post(route, handler)
}

func (manager *ServerManager) startServer() (err error) {
	if !manager.running {
		go func() {
			err = manager.server.ListenAndServe(fmt.Sprintf("%s:%d", manager.publicHost, manager.publicPort))
			if err != nil {
				log.Fatal("Unable to start the server")
			}
		}()
	} else {
		log.Print("Server already started")
	}
	return err
}

func (manager *ServerManager) formCallbackUrl(procedureName string) string {
	return fmt.Sprintf("http://%s:%d/%s", manager.publicHost, manager.publicPort, procedureName)
}
