package redisAccess

import (
	"github.com/garyburd/redigo/redis"
	"github.com/name5566/leaf/log"
	"time"
)

type RedisConfig struct {
	Host     string
	Db       int
	Auth     string
	PoolSize int
}

type RedisConn struct {
	Name        string
	Config RedisConfig
	RedisClient *redis.Pool
}

func New(host string, db int, auth string, poolSize int) (*RedisConn, error) {

	redisConn := new(RedisConn)
	redisConn.Config.Host = host
	redisConn.Config.Db = db
	redisConn.Config.Auth = auth
	redisConn.Config.PoolSize = poolSize

	return redisConn, nil
}

func (redisConn *RedisConn) InitConnectPool() {

	// 建立连接池
	redisConn.RedisClient = &redis.Pool{
		// 从配置文件获取maxidle以及maxactive
		MaxIdle:     1,
		MaxActive:   redisConn.Config.PoolSize,
		IdleTimeout: 30 * time.Second,
		Dial: func() (redis.Conn, error) {
			c, err := redis.Dial("tcp", redisConn.Config.Host)
			if err != nil {
				log.Error("dial fail %v", err)
				return nil, err
			}

			//选择DB
			c.Do("SELECT", redisConn.Config.Db)

			//密码认证
			if len(redisConn.Config.Auth) > 0 {
				_, err = c.Do("AUTH", redisConn.Config.Auth)
				if err != nil {
					log.Error("auth redis fail %v", err)
				}
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
