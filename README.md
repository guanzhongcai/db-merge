# redisMerge
合并多个不同的redis DB库到一个DB中

## 简介
工作中遇到需要将多个redis合在一起（游戏合区），尝试了一些redis的命令，并不能很好的解决项目问题，所以自写了这个一键工具。

## 项目描述
- 使用nodejs实现，连接池数目可配置
- 安装依赖库后，更改redis的config.json文件，运行程序：
```bash
node mergeRedis.js ../config/config-dev.json
```

## 注意事项
- 如果遇到重复的键值，将会覆盖！所以此工具是支持幂等操作的。
- 暂不支持list类型的键值合并
