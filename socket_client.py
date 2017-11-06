# -*- coding: utf-8 -*-
import socket
import sqlite3
import sys
import binascii
import logging
import time
import datetime
from time import gmtime, strftime
from logging.handlers import RotatingFileHandler
from apscheduler.schedulers.background import BackgroundScheduler
import pandas as pd
import MySQLdb

# create logger
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
handler = RotatingFileHandler('fetchdata.log', maxBytes=10000000, backupCount=5)
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

# global settings
_HOST = '192.168.0.150'
#_HOST = 'localhost'
_PORT = 1470
# all time value are in seconds
_RECV_TIMEOUT = 1 * 60
_SOCK_POLLING = _RECV_TIMEOUT + 1
_CLEAN_DB_PERIOD = 60 * 60

# init lookup map
_LOOKUP = pd.read_csv('fire_map.csv', dtype={'repeater_id': object})
logger.debug(_LOOKUP)

# db = MySQLdb.connect(host="192.168.0.250",  # your host 
#                      user="root",       # username
#                      passwd="1234",     # password
#                      db="alarm_momoda")   # name of the database

db = MySQLdb.connect(host="192.168.33.10",  # your host 
                     user="root",       # username
                     passwd="root",     # password
                     db="alarm_momoda")   # name of the database

def get_sensor_by_repeater(repeater):
    ''' find sensor id by repeater by mapping file
    '''
    df = _LOOKUP.loc[_LOOKUP['repeater_id'] == repeater]
    sensor = df.iloc[0].sensor_id
    return sensor

def get_fire_msg_array(data):
    ''' split, mapping hex string to message hash
    '''
    msg_array =  [x[:-2] for x in data.split('02') if ('4e47' in x or '4e67' in x)]
    msg_decode = []
    for item in msg_array:
        repeater = ''.join(item[-6:]).decode('hex')
        msg_decode.append(
            {
                'msg': 'fire' if '4e47' in item else 'recover', 
                'repeater': repeater, 
                'occurrences': strftime("%Y-%m-%d %H:%M:%S", gmtime()),
                'sensor': get_sensor_by_repeater(repeater)
            }
        )
    return msg_decode

def decode_message(buf):
    ''' decode hex message to text message array
    '''
    data = binascii.hexlify(buf)
    logger.debug(data)
    msg_array = get_fire_msg_array(data)
    for item in msg_array:
        logger.debug(item)
    return msg_array

def save_to_db(payload):
    ''' save message to db
    '''
    try:
        cur = db.cursor()
        for item in payload:
            record = (item['occurrences'], item['msg'], item['repeater'], item['sensor'])
            cur.execute("INSERT INTO fire_alarms (occurrences, msg, repeater, sensor) VALUES(%s,%s,%s,%s)", record)
        db.commit()
    except e:
        logging.error("Error %s:" % e.args[0])
        sys.exit(1)

def init_db():
    SQL = '''
        CREATE TABLE IF NOT EXISTS alarms (
            occurrences varchar(64),
            msg varchar(64),
            repeater varchar(64),
            sensor varchar(64)
        );
    '''
    with sqlite3.connect('telfire.db') as conn:
        cursor = conn.cursor()
        cursor.execute(SQL)

def remove_old_event():
    ''' remove all events from alarms table
    '''
    logger.debug('clean old event')
    with sqlite3.connect('telfire.db') as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE from alarms')

def fetch_data():
    ''' fetch data from socket server
    '''
    # create a socket object
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM) 
    s.connect((_HOST, _PORT))                               
    s.settimeout(_RECV_TIMEOUT)
    try:
        while True:
            buf = s.recv(1024)
            if len(buf) > 1:
                payload = decode_message(buf)
                if len(payload) > 0: save_to_db(payload)
            else:
                logger.debug("received %d bytes, server sokect closed" % len(buf))
                s.close()
                break
    except socket.timeout as err:
        logger.debug(err)
    finally:	
        s.close()

if __name__ == '__main__':
   ''' argument: clearn up event db in N minutes
   '''
   #init_db()
   scheduler = BackgroundScheduler()
   start_time = datetime.datetime.now() + datetime.timedelta(0,3)
   # add clean db job
   # scheduler.add_job(remove_old_event, 'interval', seconds=_CLEAN_DB_PERIOD, start_date=start_time)
   # add fetch data job
   scheduler.add_job(fetch_data, 'interval', seconds=_SOCK_POLLING, start_date=start_time)
   # start job scheduler
   scheduler.start()
   try:
       while True:
           time.sleep(2)
   except (KeyboardInterrupt, SystemExit):
       # Not strictly necessary if daemonic mode is enabled but should be done if possible
       scheduler.shutdown()
