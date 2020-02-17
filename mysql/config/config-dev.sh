#!/usr/bin/env bash
#内网测试的1区和2区

dbHosts=( #被合区的源实例
    "-h127.0.0.1 -ugo -pgoodluck"   #被合区的源实例dev1
    "-h127.0.0.1 -ugo -pgoodluck"   #被合区的源实例dev2
)

dbs=( #被合区的源库1名称 注意和实例对应！
    "sg2game1"
    "sg2game2"
)

dbHostObj="-h127.0.0.1 -ugo -pgoodluck" #合区后的目标实例
db_obj="sg2game1_2" #合区后的目标库

