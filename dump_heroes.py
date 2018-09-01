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

with open("heroes.json", "w+") as f:
    f.write(json.dumps(data, indent='\t'))