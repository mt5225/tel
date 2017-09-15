# lab for tel project

## task one: read binary file

## start the socket server
`python socket_srv.py 10`

it will:
  -  create the db `telfire` if not exist
  - and clean up all records in table `alarms`
  - start the sheduler with interval 10 minutes, which in turn clear all event in table
  - listening to port `9005` 


## test
  - `python api_srv.py` 
  - curl -i -X GET http://localhost:9006/fire

## download tel scene
  - curl -i -X GET http://www.3dmomoda.com/scene/downjson\?sceneid\=20170902015219229693920 > 20170902015219229693920.json