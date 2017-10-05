import socket                                         
import time
import logging

# create logger
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# create a socket object
serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM) 

# get local machine name
host = 'localhost'                 

port = 1470                                           

# bind to the port
serversocket.bind((host, port))                                  

# queue up to 5 requests
logging.debug("server listening to %d" % port)
serversocket.listen(5)                                           

while True:
    # establish a connection
    clientsocket,addr = serversocket.accept()      
    logging.debug("Got a connection from %s" % str(addr))
    currentTime = time.ctime(time.time()) + "\r\n"
    item = 'Test_2 0910_3F-6.bin'
    with open("./data/" + item, "rb") as binary_file:
        buf = binary_file.read()
        clientsocket.send(buf)
        clientsocket.close()
    