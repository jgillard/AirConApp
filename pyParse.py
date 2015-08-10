import requests
import json
from tabulate import tabulate
import dateutil.parser
from datetime import datetime, timezone
from twilio import TwilioRestException
from twilio.rest import TwilioRestClient
import time

enableSMS = False
printTable = True

headers = {'X-Parse-Application-Id': 'fhuSblfircn10OfsD4VPtpXQoFAH2lHFgXtu6YdL',
           'X-Parse-REST-API-Key': '65mZOASP9w3MSLbxeYEOpIkUIx1ihGUgORn7oYsg'}
twilio_account_sid = "AC63367523f0ebff7935dc582289f5e2f4"
twilio_auth_token = "24e39fc4d0b114e5784318a2b67127f2"


def getData():
    # Get the list of Users
    r = requests.get('https://api.parse.com/1/users', headers=headers)
    users = json.loads(r.text)['results']

    for user in users:
        # Select entries in Pushes that match User Pointer, limit to newest 10
        params = {'where': json.dumps({
            'user': {
                '__type': 'Pointer',
                'className': '_User',
                'objectId': user['objectId']
            }}),
            'order': '-createdAt',
            'limit': 10
            }
        r = requests.get('https://api.parse.com/1/classes/Pushes',
                         params=params, headers=headers)
        entries = json.loads(r.text)['results']

        return (users, entries)


def makeTable(users, entries):
    for user in users:
        # Set up push data table
        tableheader = ['pushScheduled', 'pushTriggered', 'pushAcknowledged']
        tabledata = []
        for entry in entries:
            if entry['user']['objectId'] != user['objectId']:
                continue
            temp = []
            for col in tableheader:
                if col in entry:
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

        print(user['objectId'] + ' ' + user['username'])
        printser = analyze(tabledata)
        if printTable and printUser:
            printTable(tabledata, tableheader)


def analyze(data):
    # Get latest pushScheduled and pushTriggered
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

    if 'latestpushScheduled' not in locals():
        print('Not enough data')
        return False

    # If latest pushScheduled newer than latest pushTriggered (never triggered)
    delta =  latestpushScheduled - latestpushTriggered      # Should usually be negative
    if delta.seconds > 600 and delta.seconds < 36000:
        print(delta.seconds)
        print('not sure how this happened :S')
        sendSMS("+447809146848", "lastSched: &s, lastTrig: &s"
                % datetime.strftime(latestpushScheduled, "%Y-%m-%d %H:%M:%S"),
                datetime.strftime(latestpushTriggered, "%Y-%m-%d %H:%M:%S"))

    # If latest pushTriggered newer than latest pushAcknowledged
    deltaAck = latestpushTriggered - latestpushAcknowledged     # Should usually be negative
    print(deltaAck.seconds)
    print(deltaAck.days)
    # And Triggered age greater than [10 minutes]
    deltaNow = datetime.now(timezone.utc) - latestpushTriggered
    print(deltaNow.seconds)
    if deltaAck.seconds > 0 and deltaAck.days == 0 and deltaNow.seconds > 600:
        print('Sound of tha police!')
        sendSMS("+447809146848", "lastSched: &s, lastTrig: &s"
                % datetime.strftime(latestpushTriggered, "%Y-%m-%d %H:%M:%S"),
                datetime.strftime(latestpushTriggered, "%Y-%m-%d %H:%M:%S"))
    return True


def printTable(tabledata, tableheader):
    print(tabulate(tabledata, tableheader, tablefmt='psql'))


def sendSMS(to, body):
    print(to, body)
    if sendSMS:
        try:
            client = TwilioRestClient(twilio_account_sid, twilio_auth_token)
            message = client.messages.create(to=to,
                                             from_="+441613751791",
                                             body=body)
            print(message.sid)
        except TwilioRestException as e:
            print(e)


if enableSMS:
    sendSMS("+447809146848", "Hello there!")

while True:
    users, entries = getData()      # Get new data
    makeTable(users, entries)
    time.sleep(60)                  # Wait 1 minute to repeat
