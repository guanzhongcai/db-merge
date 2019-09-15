var _poolModule = require('generic-pool');

/*
 * Create redis connection pool.
 */
var createRedisPool = function(redisConfig) {
    var poolsize = redisConfig.poolsize;
    if (!poolsize){
        poolsize = 500;
        console.warn('未配置redis的poolsize！使用默认::', poolsize);
    }

    return new _poolModule.Pool({
        name: 'redis',
        create: function(callback) {
            var redis = require('redis');
            var client = redis.createClient(
                redisConfig.port,
                redisConfig.host,
                {auth_pass: redisConfig.auth_pass}
            );
            client.select(redisConfig.db, function(err, res){
                callback(null, client);
            });
        },
        destroy: function(client) {
            client.quit();
        },
        max: poolsize,
        idleTimeoutMillis : 30000,
        log : false
    });
};

exports.createRedisPool = createRedisPool;
