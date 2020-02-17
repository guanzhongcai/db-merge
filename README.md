# 项目描述
工作中遇到游戏合区，需要将多个不同的DB数据但相同数据库结构的数据库DB，包括MySQL、mongo、Redis，合并在一起，尝试了这些DB的相关命令，并不能很好的一两个指令就能解决项目问题，所以自研了这个一键工具。

## 项目介绍

### Redis合并
- 使用nodejs实现，node版本10.6
- redis连接池数目可配置
    ```bash
    cd ./redis
    cp config/config-dev.sh config-NEW.sh
    vi config-NEW.sh #修改为正式的配置
    node mergeRedis.js ./config-NEW.json
    ```
- 注意事项
    - 如果遇到重复的键值，将会覆盖！所以此工具是支持幂等操作的。
    - 暂不支持list类型的键值合并

### MySQL合并
- 纯MySQL的shell命令实现
- MySQL client版本建议5.7
```bash
cd ./mysql
cp config/config-dev.sh config-NEW.sh
vi config-NEW.sh #修改为正式的配置
bash mergeMysql.sh ./config-NEW.sh
```


### mongo合并
- 纯mongo的shell命令实现
- mongo命令版本建议4.0
- 更新数据库最新的tables到table.sh中
- 导出源库+导入目标库：
```bash
cd ./mongo
cp config/config-dev.sh config-NEW.sh
vi config-NEW.sh #修改为正式的配置
bash mergeMongo.sh ./config-NEW.sh
```

