import csv

from flask import Flask, render_template, jsonify

from twitterapi import twitter_blueprint

app = Flask(__name__)

app.register_blueprint(twitter_blueprint)



@app.route('/')
def index():
    return render_template('index.html')

@app.route('/locations/')
def mcdonalds_locations():
    with open('mcrib/static/mcdonalds_with_canada.csv') as f:
        alllatlong = []
        for line in f:
            splitline = line.split(',')
            address = splitline[2]
            lat = splitline[1]
            lon = splitline[0]
            latlon = {'address': address, 'latitude': lat, 'longitude': lon}
            alllatlong.append(latlon)
    return jsonify({'locations': alllatlong})


if __name__ == '__main__':
    application.run(debug=True)
