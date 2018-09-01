from dotabase import *
from datetime import datetime, timedelta
import re
import json
import requests
from collections import OrderedDict

import plotly.offline as py
import plotly.graph_objs as go

player = 95211699

num_heroes = 10
counter_range = timedelta(days=7)
increment_delta = timedelta(days=4)

def match_date(match):
	return datetime.utcfromtimestamp(match["start_time"])

def is_date_in_range(current_date, date):
	start = current_date - counter_range
	end = current_date + counter_range
	return date < end and date > start


session = dotabase_session()

r = requests.get(f"https://api.opendota.com/api/players/{player}/matches")

matches = json.loads(r.content, object_pairs_hook=OrderedDict)

# total matches played by a hero
hero_totals = {}
for match in matches:
	hero_totals[match["hero_id"]] = hero_totals.get(match["hero_id"], 0) + 1

# total matches played by top 10 heroes
hero_totals_top = OrderedDict()
for key, value in sorted(hero_totals.items(), key=lambda x: x[1], reverse=True):
	hero_totals_top[key] = value
	num_heroes -= 1
	if num_heroes <= 0:
		break

first_day = match_date(matches[len(matches) - 1])
last_day = match_date(matches[0])


match_dates = []
for match in matches:
	match_dates.append((match_date(match), match["hero_id"]))

heroes = []

for hero_id in hero_totals_top:
	hero = session.query(Hero).filter_by(id=hero_id).first()
	heroes.append({
		"hero": hero,
		"x": [],
		"y": [],
		"counts": [],
		"last_y": -1
	})

increment_dates = []

data = []

# get counts for all the increments
i = 0
current_date = first_day
while current_date < last_day:
	increment_dates.append(current_date)
	for hero in heroes:
		hero["counts"].append(0)
	for date, hero_id in match_dates:
		if is_date_in_range(current_date, date):
			for hero in heroes:
				if hero["hero"].id == hero_id:
					hero["counts"][i] += 1
	current_date += increment_delta
	i += 1

# generate the plots
for hero in heroes:
	x = []
	y = []
	counts = hero["counts"]
	for i in range(len(increment_dates)):
		if i > 0 and i < len(increment_dates) - 1 and counts[i] == counts[i - 1] and counts[i] == counts[i + 1]:
			continue
		x.append(increment_dates[i])
		y.append(counts[i])

	data.append(go.Scatter(
		x = x,
		y = y,
		name = hero["hero"].localized_name,
		line = { "color": hero["hero"].color }
	))


py.plot(data, filename=f"hero_data_{player}.html")
