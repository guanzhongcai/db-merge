package conf

import (
	"encoding/json"
	"github.com/name5566/leaf/log"
	"io/ioutil"
)

type Server struct {
	Name     string `json:"name"`      //"name": "db12",
	Host     string `json:"host"`      //"host" : "127.0.0.1",
	Port     int    `json:"port"`      //"port" : 6379,
	Db       int    `json:"db"`        //"db" : 12,
	Auth     string `json:"auth_pass"` //"auth_pass": "gotech123",
	PoolSize int    `json:"poolsize"`  //"poolsize": 20
}

var Conf struct {
	Source []Server `json:"source"`
	Object Server   `json:"object"`
}

func init() {

	data, err := ioutil.ReadFile("../config-dev.json")
	if err != nil {
		log.Fatal("%v", err)
	}
	err = json.Unmarshal(data, &Conf)
	if err != nil {
		log.Fatal("%v", err)
	}

	log.Debug("Conf %+v\n", Conf)
}
