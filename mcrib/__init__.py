import csv

from flask import Flask, render_template, jsonify

from twitterapi import twitter_blueprint

app = Flask(__name__)

app.register_blueprint(twitter_blueprint)



@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    application.run(debug=True)
