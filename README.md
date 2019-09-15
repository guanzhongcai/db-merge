# redisMerge
合并多个不同的redis DB库到一个DB中

## 简介
工作中遇到需要将多个redis合在一起（游戏合区），尝试了一些redis的命令，并不能很好的解决项目问题，所以自写了这个一键工具。

## 项目描述
使用了GO语言和nodejs两个版本，其中GO语言提供linux的可执行文件版本

### golang版本


### nodejs版本
安装依赖库后，更改redis的config.json文件，运行程序：
```
node mergeRedis.js ../../config-dev.json
```

## 注意事项
如果遇到重复的键值，将会覆盖！所以此工具是支持幂等操作的。

