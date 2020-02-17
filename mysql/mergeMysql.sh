#!/usr/bin/env bash

if [[ $# = 0 ]];
then
    echo "请输入要合区的配置文件路径！"
    exit
fi;

source config/config-dev.sh
source $1 #会自动替换默认的dev配置
echo "目标库是："${dbHostObj}

#数据库备份选项
back_db_opt="--set-gtid-purged=OFF --no-tablespaces --force --complete-insert --insert-ignore --no-create-info --no-create-db --verbose --databases"
back_table_opt="--complete-insert --insert-ignore --no-create-info --verbose"

srcNum=${#dbHosts[*]}

echo "备份源库，源库数目${srcNum}.."
for ((i=0;i<srcNum;i++)) do
    mysqldump ${dbHosts[i]} ${back_db_opt} ${dbs[i]} > dbHost${i}.sql
done

echo "替换库名.."
for ((i=0;i<srcNum;i++)) do
    echo "${db_obj}.."
    sed -i -e "s/${dbs[i]}/${db_obj}/g" dbHost${i}.sql
done
rm *-e


echo "创建目标库.."
cp ./db_struct.sql ${db_obj}.sql
mysql ${dbHostObj} -e "source ./${db_obj}.sql"


echo "导入源库数据到目标库.."
for ((i=0;i<${srcNum};i++)) do
    echo "${db_obj}.."
    mysql ${dbHostObj} ${db_obj} -e "source ./dbHost${i}.sql"
done


echo "合区后目标库各服玩家数目："
mysql ${dbHostObj} ${db_obj} -e "select serverID, count(1) nPlayer from tb_player group by serverID"


echo "【完毕】"
