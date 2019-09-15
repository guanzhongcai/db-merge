/**
 * redis访问类
 */

class RedisAccess {

    constructor(redisConfig) {
        this._pool = require('./rdb-pool').createRedisPool(redisConfig);
    }

    exec(command, args, cb){

        const _pool = this._pool;

        _pool.acquire(function(err, client) {
            if (err) {
                throw err;
            }

            client.send_command(command, args, function(err, res){
                if (err){
                    console.trace("redis操作失败::", err, res, command, args);
                    _pool.destroy(client);
                }
                else {
                    _pool.release(client);
                }

                if (err) return cb && cb(err);

                if (cb) cb(null, res);

                if (err){
                    throw err;
                }
            });
        });
    }

    shutdown(){
        this._pool.destroyAllNow();
    };

}

module.exports = RedisAccess;
