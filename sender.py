import socket
import sys
import time

def send_message(message):
    """ send message to server
    """
    clientsocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    clientsocket.connect(('localhost', 9005))
    #clientsocket.connect(('uinnova.com', 9005))
    clientsocket.send(message)


if __name__ == '__main__':
    for item in ['Test_2_0910_setup.bin', 'Test_2 0910_3F-3.bin', 'Test_2 0910_3F-4.bin', 'Test_2 0910_3F-6.bin']:
        with open("./data/" + item, "rb") as binary_file:
            payload = binary_file.read()
            send_message(payload)
        time.sleep(1)