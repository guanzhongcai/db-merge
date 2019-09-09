/**
 * redis基于db合并迁移到目标库
 * 支持多个源库
 */

const fs = require("fs");
const async = require("async");
const RedisMerge = require("./RedisMerge");

let redisObj; //目标库连接
let debugLog = 0; //debug开关
let rdbSize = {}; //源库大小 name -> dbsize

function goMerging() {

    const configFile = process.argv[2];
    debugLog = process.argv[3] || 0;
    if (!configFile) {
        console.warn("请传入配置文件！命令执行方式：node mergeRedis.js ./config-dev.json");
        return;
    }

    const tStart = Date.now();
    const {source, object} = JSON.parse(fs.readFileSync(configFile, "utf8"));
    console.log("源库:", source);
    console.log("目标库:", object);

    console.log(`开始迁移..`);
    redisObj = new RedisMerge(object);
    for (let config of source) {
        scanKeys(config);
    }

    let curSize = 0;
    const itv = setInterval(function () {
        redisObj.exec("DBSIZE", [], function (err, dbsize) {

            let total = 0;
            for (let name in rdbSize) {
                total += rdbSize[name];
            }
            const tSpan = Math.round((Date.now() - tStart) / 1000);
            const rate = Math.round(dbsize / total * 1000) / 10;
            console.log(`当前目标库DBSIZE=${dbsize}, total=${total}, 已运行${tSpan}秒，迁移进度约=${rate}%`);

            if (curSize < dbsize) {
                curSize = dbsize;
            } else {
                console.log(`DBSIZE不再变化！各源库大小: %j, total=${total}, diff=${total - curSize}`, rdbSize);
                // clearInterval(itv);
            }
        })
    }, 2000);
}

/**
 扫描key 目标库存在就合并 不存在就增加
 */
function scanKeys(config) {

    const {name, area} = config;
    const redisSrc = new RedisMerge(config);
    redisSrc.redisObjSet(redisObj);
    redisSrc.name = name;
    redisSrc.area = area;
    redisSrc.exec("DBSIZE", [], function (err, dbsize) {

        console.log(`源库 ${name} DBSIZE = ${dbsize}`);
        rdbSize[name] = dbsize;

        let cursor = "0";
        const processor = function (key, cb) {
            return redisSrc.saveKey(key, cb);
        };

        async.whilst(
            function (cb1) {
                cb1(null, true);
            },
            function (callback) {
                redisSrc.exec("SCAN", [cursor], function (err, res) {
                    const [c, keys] = res;
                    cursor = c;
                    if (keys.length === 0) {
                        console.warn(`${name}, cursor=${cursor}, len=0, err=${err}`);
                        checkCursor(cursor, callback);
                    } else {
                        async.eachLimit(keys, keys.length, processor, function (err) {
                            // console.log(`eachLimit %j`, keys, err);
                            // personal_invade_30 personal_invade_29
                            checkCursor(cursor, callback);
                        });
                    }
                });
            },
            function (err) {
                console.log(`源库scanKeys完毕 ${name} ${err}`)
            }
        )
    });
}


function checkCursor(cursor, callback){

    if (cursor === "0") {
        callback('finish');
    } else {
        process.nextTick(callback);
    }
}

goMerging();
