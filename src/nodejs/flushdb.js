/**
 * redis库清空目标库
 */

const fs = require("fs");
const RedisAccess = require("../../server/shared/redis/RedisAccess");

function flushDb() {

    const configFile = process.argv[2];
    if (!configFile){
        console.warn("请传入配置文件！命令执行方式: node flushdb.js ./config-xxx.json");
        return;
    }


    const config = JSON.parse(fs.readFileSync(configFile, "utf8")).object;
    console.log("%j", config);

    //目标库建立连接
    const redisObj = new RedisAccess(config);

    redisObj.exec("dbsize", [], function (err, dbsize) {
        console.log("dbsize:", err, dbsize);

        redisObj.exec("flushdb", [], function (err, res) {

            console.log("flushdb::", err, res);
            redisObj.shutdown();
        });
    });
}

flushDb();
