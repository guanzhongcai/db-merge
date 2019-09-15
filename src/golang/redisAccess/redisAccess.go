package redisAccess

import (
	"github.com/garyburd/redigo/redis"
	"github.com/name5566/leaf/log"
	"strconv"
	"time"
)

type RedisConfig struct {
	Host     string
	Port     int
	Db       int
	Auth     string
	PoolSize int
}

type RedisConn struct {
	Name        string
	Config      RedisConfig
	RedisClient *redis.Pool
}

func New(host string, port int, db int, auth string, poolSize int) (*RedisConn, error) {

	redisConn := new(RedisConn)
	redisConn.Config.Host = host
	redisConn.Config.Port = port
	redisConn.Config.Db = db
	redisConn.Config.Auth = auth
	redisConn.Config.PoolSize = poolSize

	redisConn.initConnectPool()
	return redisConn, nil
}

func (redisConn *RedisConn) initConnectPool() {

	// 建立连接池
	redisConn.RedisClient = &redis.Pool{
		// 从配置文件获取maxidle以及maxactive
		MaxIdle:     1,
		MaxActive:   redisConn.Config.PoolSize,
		IdleTimeout: 30 * time.Second,
		Dial: func() (redis.Conn, error) {
			host := redisConn.Config.Host + ":" + strconv.Itoa(redisConn.Config.Port)
			c, err := redis.Dial("tcp", host)
			if err != nil {
				log.Error("dial fail: host=%v err=%v", host, err)
				return nil, err
			}

			//密码认证
			if len(redisConn.Config.Auth) > 0 {
				_, err = c.Do("AUTH", redisConn.Config.Auth)
				if err != nil {
					log.Error("auth redis fail %v", err)
				}
			}

			//选择DB
			reply, err := c.Do("SELECT", redisConn.Config.Db)
			if err != nil {
				log.Fatal("select db err=%+v reply=%+v\n", err, reply)
			}
			return c, err
		},
	}

}

func (redisConn *RedisConn) Execute(commandName string, args ...interface{}) (reply interface{}, err error) {

	// 从池里获取连接
	rc := redisConn.RedisClient.Get()
	// 用完后将连接放回连接池
	defer rc.Close()

	reply, err = rc.Do(commandName, args ...)
	if err != nil {
		log.Error("RedisDo fail %v %s %v", err, commandName, args)
	}
	return
}
