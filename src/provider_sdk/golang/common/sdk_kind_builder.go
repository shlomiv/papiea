package common

import (
	"encoding/json"
	"github.com/pkg/errors"
	"github.com/qiangxue/fasthttp-routing"
)

type KindBuilder struct {
	Kind
	EntityUrl string
	Prefix    *string
	ServerManager
}

func (builder *KindBuilder) Procedure(name string, rbac interface{},
	executionStrategy ExecutionStrategy,
	inputDesc interface{},
	outputDesc interface{},
	handler func(ctx ProceduralContext, entity *Entity, input interface{}) (Entity, error)) {
	callbackUrl := builder.ServerManager.fromProcedureName(name)
	procedureSignature := ProceduralSignature{
		Name:              name,
		Argument:          inputDesc,
		Result:            outputDesc,
		ExecutionStrategy: executionStrategy,
		ProcedureCallback: callbackUrl,
	}
	builder.Kind.Procedures[name] = procedureSignature
	builder.ServerManager.registerHandler("/"+name, func(c *routing.Context) (err error) {
		requestData := struct {
			Input  *interface{} `json:"input,omitempty"`
			entity Entity
		}{}
		err = json.Unmarshal(c.Request.Body(), &requestData)
		if err != nil {
			return errors.New("Unable to deserialize request body into Papiea entity")
		}
		if builder.Prefix == nil {
			return errors.New("Provider prefix is not set")
		}
		if entity, err := handler(ProceduralContext{builder.EntityUrl, *builder.Prefix}, &requestData.entity, requestData.Input); err != nil {
			return errors.New("Unable to execute handler")
		} else {
			err = c.WriteData(entity.Spec)
			return err
		}
	})
}
