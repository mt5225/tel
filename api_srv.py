# -*- coding: utf-8 -*-
import sqlite3
import logging
from flask import Flask, jsonify
from logging.handlers import RotatingFileHandler
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from types import NoneType

app = Flask(__name__, static_url_path='', static_folder='static')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///telfire.db'
db = SQLAlchemy(app)

@app.route('/')
def index():
    return jsonify(msg='Hello, TEL!'), 200

@app.route('/fire', methods=['GET'])
def doorstatus():
    msg_array = []
    result = db.engine.execute("SELECT * FROM alarms ORDER BY ROWID")
    for row in result:
        msg_array.append('|'.join(row))
    app.logger.debug(msg_array)
    msg_short = '#'.join(msg_array) if len(msg_array) > 0 else ""
    return msg_short, 200

if __name__ == '__main__':
    LOG_FILENAME = './tel_api_srv.log'
    formatter = logging.Formatter(
        "[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    handler = RotatingFileHandler(LOG_FILENAME, maxBytes=10000000, backupCount=5)
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    CORS(app)
    app.run(host='0.0.0.0', port=9006, debug=True)