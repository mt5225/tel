# lab for tel project

## task one: read binary file

## start API service
  - API Server :  `python api_srv.py`

  it will:
  -  create the db `telfire` if not exist
  - and clean up all records in table `alarms`
  - start the sheduler with interval 10 minutes, which in turn clear all event in table
  - listening to port `9005` 

## test API service
  - `python api_srv.py` 
  - curl -i -X GET http://localhost:9006/fire
  - curl -i -X GET http://localhost:9006/gas
  - http://192.168.33.10/phpmyadmin   root:root
  - MySQL Select rows on first occurrence of each unique value
`select * from ( select * from alarm order by id desc) x group by tag;`

## start socket client [fire alarm]
  - Socket Client: `python socket_client.py`

## download tel scene
  - curl -i -X GET http://www.3dmomoda.com/scene/downjson\?sceneid\=20170902015219229693920 > 20170902015219229693920.json