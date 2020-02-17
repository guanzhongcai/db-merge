#!/usr/bin/env bash
#内网测试的1区和2区

dbHosts=( #源库host信息
    "mongodb://user:password@hostIP:3717/db1?authSource=admin"  #源实例dev1
    "mongodb://user:password@hostIP:3717/db2?authSource=admin"  #源实例dev2
)

dbs=( #源库名 请务必和上面的host信息对应好！
    "db1"
    "db2"
)

dbHostObj="mongodb://user:password@hostIP:3717/db1_2?authSource=admin"   #目标实例

dbObj="db1_2"    #目标库

