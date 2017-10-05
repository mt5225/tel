import socket                                         
import time
import logging
import random

# create logger
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# get local machine name
_HOST = 'localhost'                 
_PORT = 1470                                           
      

#list of sample message files
_MSG_LST = ['Test_2_0910_setup.bin', 'Test_2 0910_3F-3.bin', 'Test_2 0910_3F-4.bin', 'Test_2 0910_3F-6.bin']

if __name__ == '__main__':
    serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serversocket.bind((_HOST, _PORT))
    logging.debug("server listening to %d" % _PORT)
    serversocket.listen(5)  
    while True:
        # establish a connection
        clientsocket,addr = serversocket.accept()      
        logging.debug("Got a connection from %s" % str(addr))
        for item in _MSG_LST:
            with open("./data/" + item, "rb") as binary_file:
                buf = binary_file.read()
                wait_time = random.randint(5,20)
                logging.debug("wait for %d seconds" % wait_time)
                time.sleep(wait_time)
                logging.info("send sample message [%s]" % item)
                clientsocket.send(buf)
        # logging.debug('done, close client socket')
        # clientsocket.close()
    