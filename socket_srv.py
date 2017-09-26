# -*- coding: utf-8 -*-
import socket
import sqlite3
import sys
import binascii
import logging
import time
import pandas as pd
from time import gmtime, strftime
from apscheduler.schedulers.background import BackgroundScheduler

# create logger
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# init lookup map
LOOKUP = pd.DataFrame()

def get_sensor_by_repeater(repeater):
    ''' find sensor id by repeater by mapping file
    '''
    df = LOOKUP.loc[LOOKUP['repeater_id'] == repeater]
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
    logging.debug(data)
    msg_array = get_fire_msg_array(data)
    for item in msg_array:
        logging.debug(item)
    return msg_array
    

def recv_timeout(the_socket,timeout=2):
    ''' get data from socket with timeout
    '''
    #make socket non blocking
    the_socket.setblocking(0)
     
    #total data partwise in an array
    total_data=[];
    data='';
     
    #beginning time
    begin=time.time()
    while 1:
        #if you got some data, then break after timeout
        if total_data and time.time()-begin > timeout:
            break
         
        #if you got no data at all, wait a little longer, twice the timeout
        elif time.time()-begin > timeout*2:
            break
         
        #recv something
        try:
            data = the_socket.recv(8192)
            if data:
                total_data.append(data)
                #change the beginning time for measurement
                begin = time.time()
            else:
                #sleep for sometime to indicate a gap
                time.sleep(0.1)
        except:
            pass
     
    #join all parts to make final string
    return ''.join(total_data)

def save_to_db(payload):
    ''' save message to db
    '''
    try:
        conn = sqlite3.connect('telfire.db')
        cur = conn.cursor()
        for item in payload:
            record = (item['occurrences'], item['msg'], item['repeater'], item['sensor'])
            cur.execute("INSERT INTO alarms VALUES(?,?,?,?)", record)
        conn.commit()
    except sqlite3.Error, e:
        logging.error("Error %s:" % e.args[0])
        sys.exit(1)
    finally:
        if conn:
            conn.close()

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
        cursor.execute('DELETE from alarms')

def remove_old_event():
    ''' remove all events from alarms table
    '''
    logging.debug('clean old event')
    with sqlite3.connect('telfire.db') as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE from alarms')


def start_event_cleaner(keepalive = 1):
    ''' run the event cleaner every keepalive minutes
    '''
    scheduler = BackgroundScheduler()
    scheduler.add_job(remove_old_event, 'interval', minutes=keepalive)
    scheduler.start()

def main():
    serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serversocket.bind(('0.0.0.0', 9005))
    serversocket.listen(5) # become a server socket, maximum 5 connections
    logging.debug("socket server listening at port 9005 ...")

    while True:
        connection, address = serversocket.accept()
        buf = recv_timeout(connection)
        if len(buf) > 0:
            payload  = decode_message(buf)
            if len(payload) > 0:
                save_to_db(payload)

def load_repeater_sensor_map():
   return pd.read_csv('fire_map.csv', dtype={'repeater_id': object})

if __name__ == '__main__':
   ''' argument: clearn up event db in N minutes
   '''
   init_db()
   LOOKUP = load_repeater_sensor_map()
   logging.debug(LOOKUP)
   start_event_cleaner(int(sys.argv[1]))
   main()