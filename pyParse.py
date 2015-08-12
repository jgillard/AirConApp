import requests
import json
from tabulate import tabulate
import dateutil.parser
from datetime import datetime, timezone
import time
import configparser
import sys

testSMS = False
enableSMS = True
printTable = False

warnSent = []
alarmSent = []

config = configparser.ConfigParser()
config.read('pyParseConfig.ini')
headers = {'X-Parse-Application-Id': config['PARSE']['X-Parse-Application-Id'],
           'X-Parse-REST-API-Key': config['PARSE']['X-Parse-REST-API-Key']}

def getData():
    r = requests.get('https://api.parse.com/1/users', headers=headers)
    users = json.loads(r.text)['results']

    for user in users:
        # Select entries in Pushes that match User Pointer, limit to newest 20
        params = {'where': json.dumps({
            'user': {
                '__type': 'Pointer',
                'className': '_User',
                'objectId': user['objectId']
            }}),
            'order': '-createdAt',
            'limit': 20
            }
        r = requests.get('https://api.parse.com/1/classes/Pushes',
                         params=params, headers=headers)
        entries = json.loads(r.text)['results']

        # Make table for users one-by-one
        print(user['objectId'] + ' ' + user['username'])
        makeTable(user, entries)


def makeTable(user, entries):
    tableheader = ['pushScheduled', 'pushTriggered', 'pushAcknowledged']
    tabledata = []
    for entry in entries:
        temp = []
        for col in tableheader:
            if col in entry:
                # Grab and format date for each push time column
                date = json.dumps(entry[col]['iso'])[1:-1]
                date = dateutil.parser.parse(date)
                temp.append(date)
            else:
                temp.append('')
        temp.append(json.dumps(entry['location']['lat']))
        temp.append(json.dumps(entry['location']['long']))
        temp.append(json.dumps(entry['location']['acc']))
        tabledata.append(temp)
    tableheader += ['lat', 'long', 'acc']

    analyze(tabledata, user)
    if printTable:
        print(tabulate(tabledata, tableheader, tablefmt='psql'))


def analyze(data, user):
    # Get latest push from each column
    for row in data:
        if row[0] != '':
            latestpushScheduled = row[0]
            print('latestSched: %s' % datetime.strftime(latestpushScheduled, "%Y-%m-%d %H:%M:%S"))
            break
    for row in data:
        if row[1] != '':
            latestpushTriggered = row[1]
            print('latestTrig: %s' % datetime.strftime(latestpushTriggered, "%Y-%m-%d %H:%M:%S"))
            break
    for row in data:
        if row[2] != '':
            latestpushAcknowledged = row[2]
            print('latestAck: %s' % datetime.strftime(latestpushAcknowledged, "%Y-%m-%d %H:%M:%S"))
            break

    if 'latestpushAcknowledged' not in locals():
        print('Not enough data')
        return

    global warnSent
    global alarmSent

    # If latest pushScheduled newer than latest pushTriggered
    # ie. it never triggered -  shouldn't happen therefore usually negative
    delta = latestpushScheduled - latestpushTriggered
    if delta.seconds > 600 and delta.days == 0:
        print('HUH? SMS sent to the developer')
        sendSMS("+447809146848", "user: {0}, lastSched: {1}, lastTrig: {2}"
                .format(user['username'],
                datetime.strftime(latestpushScheduled, "%Y-%m-%d %H:%M:%S"),
                datetime.strftime(latestpushTriggered, "%Y-%m-%d %H:%M:%S")))

    # If latest pushTriggered newer than latest pushAcknowledged
    # ie. not responded to - should usually be negative
    deltaAck = latestpushTriggered - latestpushAcknowledged
    # And pushTriggered age greater than 10 minutes
    deltaNow = datetime.now(timezone.utc) - latestpushTriggered
    print('dSecs: {0}, dAckSecs: {1}, dAckDays: {2}, dNowSecs: {3}'
        .format(delta.seconds, deltaAck.seconds, deltaAck.days, deltaNow.seconds))

    # Send the warning to the user after 10 minutes
    if deltaAck.seconds > 0 and deltaAck.days == 0 and deltaNow.seconds > 600:
        if user['username'] not in warnSent:
            print('WARNING! SMS sent to', user['username'])
            warnSent.append(user['username'])
            sendSMS(user['phonenumber'], "AirConApp: Please press Acknowledge in the next 10 minutes or sirens will start blaring")

    # Send the alarm to a specified number after 20 minutes
    if deltaAck.seconds > 0 and deltaAck.days == 0 and deltaNow.seconds > 1200:
        if user['username'] not in alarmSent:
            print('ALERT! SMS sent to the boss man')
            alarmSent.append(user['username'])
            sendSMS("+447809146848", "user: {0}, lastAck: {1}, lastSched: {2}".format(
                user['username'],
                datetime.strftime(latestpushAcknowledged, "%Y-%m-%d %H:%M:%S"),
                datetime.strftime(latestpushScheduled, "%Y-%m-%d %H:%M:%S")))


def sendSMS(to, body):
    if enableSMS:
        data = {'message': body, 'to': to}
        r = requests.post('https://api.parse.com/1/functions/sendSMS', data=data, headers=headers)
        print (r.status_code)
        if r.status_code != 200:
            print(r.text)


if testSMS:
    sendSMS('07809146848', 'Hello there')

while True:
    try:
        getData()
    except:
        print('Unexpected error:', sys.exc_info()[0])
    time.sleep(60)
