package common

import (
	"github.com/jinzhu/inflection"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	"testing"
)

var HostParams = map[string]string{
	"papiea_host": "127.0.0.1",
	"papiea_port": "3000",
	"public_host": "127.0.0.1",
	"public_port": "9000",
}

const TestProcedureCallback = "http://127.0.0.1:9000/moveX"

func TestSdk(t *testing.T) {
	t.Run("Pluralize works for 'test' & 'provider' words used", func(t *testing.T) {
		pluralTest := inflection.Plural("test")
		if pluralTest != "tests" {
			t.Fail()
		}
		pluralProvider := inflection.Plural("provider")
		if pluralProvider != "providers" {
			t.Fail()
		}
	})

	t.Run("Wrong yaml description causes error", func(t *testing.T) {
		sdk, err := MakeSdk(HostParams)
		if err != nil {
			t.FailNow()
		}
		if sdk == nil {
			t.Error("sdk is undefined")
			t.FailNow()
		}
		m := make(map[interface{}]interface{})

		_, err = sdk.NewKind(m)
		if err == nil {
			t.Error("Error occured")
			t.Fail()
		}
	})

	t.Run("Provider can create a new kind", func(t *testing.T) {
		data, err := ioutil.ReadFile("./location_kind_test_data.yml")
		if err != nil {
			t.Fatal("Couldn't read file")
		}
		sdk, err := MakeSdk(HostParams)
		if err != nil {
			t.Fail()
		}
		m := make(map[interface{}]interface{})

		err = yaml.Unmarshal(data, &m)
		if err != nil {
			t.Fatal("Couldn't unmarshall structure into yaml")
		}

		kindManager, err := sdk.NewKind(m)
		if err != nil {
			t.Fail()
		}
		if kindManager == nil {
			t.Error("Kind wasn't created")
			t.FailNow()
		}
		if kindManager.Name != "Location" {
			t.Fail()
		}
	})

	t.Run("Provider with no x-papiea-entity should fail", func(t *testing.T) {
		data, err := ioutil.ReadFile("./location_kind_test_data.yml")
		if err != nil {
			t.Fatal("Couldn't read file")
		}
		sdk, err := MakeSdk(HostParams)
		if err != nil {
			t.Fail()
		}
		m := make(map[interface{}]interface{})

		err = yaml.Unmarshal(data, &m)
		if err != nil {
			t.Fatal("Couldn't unmarshall structure into yaml")
		}
		delete(m["Location"].(map[interface{}]interface{}), "x-papiea-entity")

		_, err = sdk.NewKind(m)
		if err == nil {
			t.FailNow()
		}
	})

	t.Run("Provider without version should fail to register", func(t *testing.T) {
		data, err := ioutil.ReadFile("./location_kind_test_data.yml")
		if err != nil {
			t.Fatal("Couldn't read file")
		}
		sdk, err := MakeSdk(HostParams)
		if err != nil {
			t.Fail()
		}
		m := make(map[interface{}]interface{})

		err = yaml.Unmarshal(data, &m)
		if err != nil {
			t.Fatal("Couldn't unmarshall structure into yaml")
		}

		_, err = sdk.NewKind(m)
		if err != nil {
			t.Fail()
		}
		sdk.prefix("")
	})
}
