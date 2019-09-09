/**
 * redis基于db合并迁移到目标库
 * 支持多个源库
 */

const async = require("async");
const RedisAccess = require("../../server/shared/redis/RedisAccess");

let debugLog = 0; //debug开关

const familyRanks = ["family_build", "family_hero", "family_invade"];

class RedisMerge extends RedisAccess {

    constructor(redisConfig){
        super(redisConfig);
        this.redisObj = null;
    }

    redisObjSet(redisObj){

        this.redisObj = redisObj;
    }
}

/**
 * 获取key的类型
 */
RedisMerge.prototype.saveKey = function (key, cb) {

    const self = this;
    self.exec("TYPE", [key], function (err, type) {
        if (debugLog > 0) {
            console.log(`type = ${type}, key = ${key}`);
        }

        switch (type) {
            case "hash":
                self.saveHash(key, cb);
                break;

            case "set":
                self.saveSet(key, cb);
                break;

            case "zset":
                self.saveZSet(key, cb);
                break;

            case "list":
                self.saveList(key, cb);
                break;

            case "string":
                self.saveString(key, cb);
                break;

            default:
                console.error("存在不能save的key！", type);
                cb(null);
                break;
        }
    })
};

RedisMerge.prototype.checkCursor = function(cursor, callback){

    if (cursor === "0") {
        callback('finish');
    } else {
        process.nextTick(callback);
    }
};

/**
 * 从源库获取hash类的key保存到目标库
 */
RedisMerge.prototype.saveHash = function (key, cb) {

    const self = this;
    const redisObj = self.redisObj;

    self.exec("HLEN", [key], function (err, count) {
        count = Number(count);
        if (count <= 0) {
            cb(null);
            return;
        }

        if (count < 200) {
            self.exec("HGETALL", [key], function (err, kvs) {
                const args = [key].concat(kvs);
                redisObj.exec("HMSET", args, cb);
            })
        } else {
            let cursor = "0";

            async.whilst(
                function (cb1) {
                    cb1(null, true);
                },
                function (callback) {
                    self.exec("HSCAN", [key, cursor], function (err, res) {

                        const [c, kvs] = res;
                        cursor = c;
                        if (kvs.length === 0) {
                            console.warn(`${self.name}, cursor=${cursor}, key=${key}, len=0, err=${err}`);
                            self.checkCursor(cursor, callback);
                        } else {
                            const args = [key].concat(kvs);
                            redisObj.exec("HMSET", args, function (err, res) {
                                self.checkCursor(cursor, callback);
                            })
                        }
                    })
                },
                function (err) {

                    // console.log(`HSCAN hash key=${key}, count=${count}, newCount=${newCount} ${err}`);
                    cb(null);
                }
            );
        }
    });
};

/***
 * 保存有序集合
 */
RedisMerge.prototype.saveZSet = function (key, cb) {

    if (key.indexOf("buildRank") !== -1) { //城池建设排行榜不迁移
        cb(null);
        return;
    }

    let cursor = "0";
    const self = this;
    const area = self.area;
    const redisObj = self.redisObj;

    self.exec("ZCARD", [key], function (err, oldCount) {
        // console.log(`key=${key}, oldCount=${oldCount}`);

        async.whilst(
            function (cb1) {
                cb1(null, true);
            },
            function (callback) {
                self.exec("ZSCAN", [key, cursor], function (err, res) {
                    const [c, memberScores] = res;
                    cursor = c;
                    if (memberScores.length === 0) {
                        console.warn(`${self.name}, cursor=${cursor}, key=${key} len=0, err=${err}`);
                        self.checkCursor(cursor, callback);
                    } else {
                        let args = [key];
                        for (let i = 0; i < memberScores.length; i++) {
                            let [member, score] = [memberScores[i], memberScores[++i]];
                            if (familyRanks.includes(key)){
                                member = Number(member);
                                //TODO 以后任何平台都不做了
                                // member += area * 10 * 10000;
                                // console.log(`家族排行榜合并 area=${area}, member=${member}`);
                            }
                            args.push(score, member);
                        }
                        //ZADD key score1 member1 [score2 member2]
                        //向有序集合添加一个或多个成员，或者更新已存在成员的分数
                        redisObj.exec("ZADD", args, function (err, res) {
                            self.checkCursor(cursor, callback);
                        })
                    }
                })
            },
            function (err) {
                redisObj.exec("ZCARD", [key], function (err, newCount) {
                    console.log(`${self.name} zset key=${key}, oldCount=${oldCount}, newCount=${newCount}`);
                    cb(null);
                });
            }
        );
    })

};

/**
 * 保存集合
 */
RedisMerge.prototype.saveSet = function (key, cb) {

    if (key.substring(0, 6) === "redbag") {
        // console.log("红包数据不迁移");
        cb(null);
        return;
    }

    const self = this;
    const redisObj = self.redisObj;
    self.exec("SCARD", [key], function (err, count) {
        count = Number(count);
        if (count <= 0) {
            cb(null);
            return;
        }

        if (count < 200) {
            self.exec("SMEMBERS", [key], function (err, members) {

                const args = [key].concat(members);
                redisObj.exec("SADD", args, function (err, res) {
                    cb(null);
                })
            });
        } else {

            let cursor = "0";

            async.whilst(
                function (cb1) {

                    cb1(null, true);
                },
                function (callback) {
                    self.exec("SSCAN", [key, cursor], function (err, res) {
                        const [c, members] = res;
                        cursor = c;
                        if (members.length === 0) {
                            console.warn(`${self.name}, cursor=${cursor}, key=${key}, len=0, err=${err}`);
                            self.checkCursor(cursor, callback);
                        } else {
                            const args = [key].concat(members);
                            redisObj.exec("SADD", args, function (err, res) {
                                self.checkCursor(cursor, callback);
                            })
                        }

                    })
                },
                function (err) {

                    redisObj.exec("SCARD", [key], function (err, newCount) {

                        console.log(`${self.name} set key=${key} oldCount=${count}, newCount=${newCount}`);
                        cb(null);
                    });
                }
            );
        }
    });
};

/**
 * 保存列表
 */
RedisMerge.prototype.saveList = function (key, cb) {

    console.warn("暂不支持list类型迁移！！", key);
    //singles_event是女武将活动的幸运数触发奖励log
    cb(null);
};

/**
 * 保存字符串
 */
RedisMerge.prototype.saveString = function (key, cb) {

    //bitmap是string类型
    const self = this;
    const redisObj = self.redisObj;

    self.exec("GET", [key], function (err, val) {

        redisObj.exec("SET", [key, val], cb);
        console.log(`${self.name}, string key=${key}`);
    });
};


module.exports = RedisMerge;
