from dotabase import *
import json
from collections import OrderedDict

session = dotabase_session()

data = OrderedDict()

for hero in session.query(Hero):
    data[hero.id] = {
        "id": hero.id,
        "localized_name": hero.localized_name,
        "icon": f"http://dotabase.dillerm.io/dota-vpk{hero.icon}",
        "color": hero.color
    }

text = json.dumps(data, indent='\t')
text = "var heroes = " + text

with open("heroes.js", "w+") as f:
    f.write(text)