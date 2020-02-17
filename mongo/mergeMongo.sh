#!/usr/bin/env bash

if [[ $# = 0 ]];
then
    echo "请输入要合区的配置文件路径！"
    exit
fi;

source ./table.sh
source config/config-dev.sh
source $1 #会自动替换默认的dev配置
echo "目标库是："${dbHostObj}

srcNum=${#dbHosts[*]}


for ((i=0;i<srcNum;i++)) do
    echo "备份源库..${dbHosts[i]}"
    mongodump --uri=${dbHosts[i]} -o dump
done

#按表逐个恢复
tableNum=${#tables[*]}
for ((i=0; i < srcNum; i++)) do
    for ((m=0; m < tableNum; m++)) do
        table=${tables[m]}
        db=${dbs[i]}
        echo "源库${db}表${table}恢复到目标库.."
        mongorestore --uri=${dbHostObj} -d ${dbObj} -c ${table} ./dump/${db}/${table}.bson
    done
done

echo "【完毕】"
