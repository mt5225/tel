# App for tel project

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
returns: 
  `2017-10-15 05:31:14|fire|017|3F-4#2017-10-15 05:31:14|recover|017|3F-4#2017-10-15 05:31:14|fire|019|3F-6#2017-10-15 05:31:14|recover|019|3F-6#2017-10-15 05:31:14|fire|016|3F-3#2017-10-15 05:31:14|recover|016|3F-3#2017-10-15 05:31:33|fire|017|3F-4#2017-10-15 05:31:33|recover|017|3F-4#2017-10-15 05:31:38|fire|017|3F-4#2017-10-15 05:31:38|recover|017|3F-4#2017-10-15 05:31:38|fire|019|3F-6`
  
  - curl -i -X GET http://localhost:9006/gas
returns:
  `G01_ALM|C6_nan|2017-10-10 00:54:04#G30_ALM|C21_C24|2017-10-10 00:42:21`

  - http://192.168.33.10/phpmyadmin   root:root
  - MySQL Select rows on first occurrence of each unique value
`select * from ( select * from alarm order by id desc) x group by tag;`

## start socket client [fire alarm]
  - Socket Client: `python socket_client.py`

## download tel scene
  - curl -i -X GET http://www.3dmomoda.com/scene/downjson\?sceneid\=20170902015219229693920 > 20170902015219229693920.json

## misc
  - fire sensor naming:  `1F-3`, get from fire_map.csv mapping file
  - gas sensor naming: `G21_ALM`, from intouch table/mysql