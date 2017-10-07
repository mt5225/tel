# -*- coding: utf-8 -*-
import sqlite3
import logging
from flask import Flask, jsonify
from logging.handlers import RotatingFileHandler
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from types import NoneType

DB_URL = 'mysql+mysqldb://root:root@192.168.33.10/alarm_momoda'

app = Flask(__name__, static_url_path='', static_folder='static')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///telfire.db'
app.config['SQLALCHEMY_BINDS'] = {
    'gas': DB_URL,
}
db = SQLAlchemy(app)

@app.route('/')
def index():
    return jsonify(msg='Hello, TEL!'), 200

@app.route('/fire', methods=['GET'])
def fire():
    msg_array = []
    result = db.engine.execute("SELECT * FROM alarms ORDER BY ROWID")
    for row in result:
        msg_array.append('|'.join(row))
    app.logger.debug(msg_array)
    msg_short = '#'.join(msg_array) if msg_array > 0 else ""
    return msg_short, 200

@app.route('/gas', methods=['GET'])
def gas():
    msg_array = []
    query_str = 'select * from ( select * from alarm order by id desc) x group by tag'
    # query_str = 'select * from alarm'
    engine = db.get_engine(bind='gas')
    result = engine.execute(query_str)
    for row in result:
        if row[2] == 1 or row[3] == 1:
            app.logger.info("alarm from %s" % row[1])
            msg_array.append("%s|%s"%(row[1], row[4]))
    msg_short = ""
    if msg_array:
        msg_short = '#'.join(msg_array)
    else:
        app.logger.debug("no gas alarm found in intouch table")
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