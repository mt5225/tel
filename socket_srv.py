# -*- coding: utf-8 -*-
import socket
import sqlite3
import sys
import binascii
import logging
import time

# create logger
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

def get_fire_msg_array(data):
    msg_array =  [x[:-2] for x in data.split('02') if ('4e47' in x or '4e67' in x)]
    msg_decode = []
    for item in msg_array:
        msg = ''
        if '4e47' in item:
            msg = 'fire'
        else:
            msg = 'fire recover'
        sensor_info_hex = ''.join(item[-6:])
        sensor_info = sensor_info_hex.decode('hex')
        msg_decode.append({'msg': msg, 'sensor_info': sensor_info})
    return msg_decode

def save_to_db(buf):
    data = binascii.hexlify(buf)
    logging.debug(data)
    msg_array = get_fire_msg_array(data)
    for item in msg_array:
        logging.debug(item)

    

def recv_timeout(the_socket,timeout=2):
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

def main():
    serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serversocket.bind(('0.0.0.0', 9005))
    serversocket.listen(5) # become a server socket, maximum 5 connections

    while True:
        connection, address = serversocket.accept()
        buf = recv_timeout(connection)
        if len(buf) > 0:
            save_to_db(buf)

if __name__ == '__main__':
   main()