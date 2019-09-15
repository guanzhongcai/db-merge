package main

import (
	"github.com/garyburd/redigo/redis"
	"github.com/name5566/leaf/log"
	"golang/conf"
	"golang/redisAccess"
	"time"
)

func main() {

	mapDbSize := make(map[string]int)

	for _, srcConf := range conf.Conf.Source {
		log.Debug("%+v\n", srcConf)
		redisConn, _ := redisAccess.New(srcConf.Host, srcConf.Port, srcConf.Db, srcConf.Auth, srcConf.PoolSize)
		reply, _ := redis.Int(redisConn.Execute("DBSIZE"))
		mapDbSize[srcConf.Name] = reply
	}

	obj := conf.Conf.Object
	redisObj, _ := redisAccess.New(obj.Host, obj.Port, obj.Db, obj.Auth, obj.PoolSize)
	reply, _ := redis.Int(redisObj.Execute("DBSIZE"))
	mapDbSize[obj.Name] = reply

	log.Debug("mapDbSize=%+v\n", mapDbSize)

	time.Sleep(time.Second * 1)
}
