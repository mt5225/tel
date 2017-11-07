# -*- coding: utf-8 -*-
import sqlite3
import logging
import sys
from flask import Flask, jsonify
from logging.handlers import RotatingFileHandler
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from types import NoneType
import pandas as pd
from time import gmtime, strftime

DB_URL = 'mysql+mysqldb://root:root@192.168.33.10/alarm_momoda'
#DB_URL = 'mysql+pymysql://root:1234@192.168.0.250/alarm_momoda'

# innit flash app and backend db connection
app = Flask(__name__, static_url_path='', static_folder='static')
app.config['SQLALCHEMY_BINDS'] = {
    'gas': DB_URL,
    'fire':DB_URL
}

_DB = SQLAlchemy(app)

# init lookup map
_GAS_LOOKUP = pd.read_csv('gas_cctv_mapping.csv')
_FIRE_LOOKUP = pd.read_csv('fire_cctv_mapping.csv')

def get_cctvs_by_tagname(tagname):
    ''' find sensor id by repeater by mapping file
    '''
    df = _GAS_LOOKUP.loc[_GAS_LOOKUP['tag'] == tagname]
    app.logger.debug(df.iloc[0])
    cctv_str = "%s_%s" % (df.iloc[0].CCTV1, df.iloc[0].CCTV2)
    return cctv_str

def get_cctvs_by_fire_name(name):
    ''' find sensor id by repeater by mapping file
    '''
    df = _FIRE_LOOKUP.loc[_FIRE_LOOKUP['ID'] == name]
    app.logger.debug(df.iloc[0])
    cctv_str = "%s_%s" % (df.iloc[0].CCTV1, df.iloc[0].CCTV2)
    return cctv_str

@app.route('/')
def index():
    return jsonify(msg='Hello, TEL!'), 200

@app.route('/fire', methods=['GET'])
def fire():
    msg_array = []
    engine = _DB.get_engine(bind='fire')
    today_str = strftime("%Y-%m-%d", gmtime())
    result = engine.execute("SELECT occurrences, msg, repeater, sensor FROM fire_alarms where locate('%s', occurrences)>0" % today_str)
    for row in result:
        cctv_str = get_cctvs_by_fire_name(row[3])
        msg_array.append("%s|%s|%s|%s|%s"%(row[0], row[1], row[2], row[3], cctv_str))
    app.logger.debug(msg_array)
    msg_short = '#'.join(msg_array) if msg_array > 0 else ""
    return msg_short, 200

@app.route('/gas', methods=['GET'])
def gas():
    msg_array = []
    query_str = 'select * from ( select * from alarm order by id desc) x group by tag'
    # query_str = 'select * from alarm'
    engine = _DB.get_engine(bind='gas')
    result = engine.execute(query_str)
    for row in result:
        if row[2] == 1 or row[3] == 1:
            app.logger.info("alarm from %s" % row[1])
            cctv_str = get_cctvs_by_tagname(row[1])
            location = "TTCK_1F"
            msg_array.append("%s|%s|%s|%s"%(row[4],row[1],location,cctv_str))
    msg_short = ""
	#sort the array by timestamp
    msg_array.sort(reverse=True)
    if msg_array:
        msg_short = '#'.join(msg_array)
    else:
        app.logger.debug("no gas alarm found in intouch table")
    return msg_short, 200


if __name__ == '__main__':
    LOG_FILENAME = './tel_api_srv.log'
    formatter = logging.Formatter(
        "[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    CORS(app)
    app.run(host='0.0.0.0', port=9006, debug=True)
