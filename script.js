const default_player = {
	"account_id": 95211699,
	"personaname": "Bilbo's Last Clean Doily",
	"avatarfull": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/26/26f39ad1bfbede565f1e7f0399b8afd40d74c74e_full.jpg"
};

const is_timestamp_in_range = (current_timestamp, timestamp, range) => {
	var start = current_timestamp - (range / 2);
	var end = current_timestamp + (range / 2);
	return timestamp < end && timestamp > start;
}

function getDayString(date) {
	return date.toLocaleDateString('en-US', { 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	});
}

function recreateGraph(self) {
	var matches = self.matches;
	var graph = self.graph;

	var increment_range_seconds = graph.increment_range * 86400;
	var increment_delta_seconds = graph.increment_delta * 86400;

	console.time("creating graph");

	var first_day = matches[0].start_time;
	var last_day = matches[matches.length - 1].start_time;

	var hero_totals = {}
	matches.forEach(match => hero_totals[match.hero_id] = (hero_totals[match.hero_id] || 0) + 1);
	var top_heroes = Object.keys(hero_totals)
		.map(key => [key, hero_totals[key]])
		.sort((key, value) =>  value[1] - key[1])
		.slice(0, graph.num_heroes)
		.map((hero, count) => parseInt(hero));


	// generate date increments
	var increment_timestamps = [];
	var increment_dates = [];
	var timestamp = first_day;
	while (timestamp < last_day) {
		increment_timestamps.push(timestamp);
		increment_dates.push(new Date(timestamp * 1000))
		timestamp = timestamp + increment_delta_seconds;
	}

	var hero_infos = top_heroes.map(hero_id => {
		return {
			hero_id: hero_id,
			hero: hero_information[hero_id],
			counts: increment_timestamps.map(date => 0)
		};
	});

	// generate hero match data
	var i = 0; // increment_timestamps index
	var j = 0; // matches index
	var start_j = 0; // the start of our matches window
	for (i = 0; i < increment_timestamps.length; i++) {
		for (j = start_j; j < matches.length; j++) {
			if (is_timestamp_in_range(increment_timestamps[i], matches[j].start_time, increment_range_seconds)) {
				var hero_info = hero_infos.find(h => h.hero_id == matches[j].hero_id);
				if (hero_info) {
					hero_info.counts[i]++;
				}
			}
			else if (matches[j].start_time > increment_timestamps[i]) {
				// all matches after this are cronologically after this so we dont need them
				break;
			}
			else {
				// all other increment dates are after this one, so they dont need this match
				start_j = j + 1;
			}
		}
	}

	var dyData = []

	for (var i = 0; i < increment_timestamps.length; i++) {
		var column = hero_infos.map(hero_info => hero_info.counts[i]);

		if (graph.percentage) {
			var total = column.reduce((a, b) => a + b) || 1;
			column = column.map(v => (v * 100.0) / total)
		}

		column.unshift(increment_dates[i]);
		dyData.push(column);
	}

	var dyLabels = hero_infos.map(hero_info => hero_info.hero.localized_name);
	dyLabels.unshift("Time");

	var dySeries = {};
	hero_infos.forEach(hero_info => {
		dySeries[hero_info.hero.localized_name] = {
			color: hero_info.hero.color
		}
		if (graph.smooth_lines){
			dySeries[hero_info.hero.localized_name].plotter = smoothPlotter
		}
	});

	function legendFormatter(data) {
		var heroes = self.heroes;
		data.series.forEach(hero_data => {
			var hero = heroes.find(h => h.localized_name == hero_data.labelHTML);
			hero.value = hero_data.yHTML;
		});
		self.heroes.__ob__.dep.notify();
		return "";
	}
	console.timeEnd("creating graph");

	var div = document.getElementById("graphdiv");
	var graph = new Dygraph(div, 
		dyData,
		{
			fillGraph: graph.fill,
			fillAlpha: 1.0,
			stackedGraph: graph.stacked,
			labels: dyLabels,
			series: dySeries,
			hideOverlayOnMouseOut: false,
			animatedZooms: true,
			strokeWidth: graph.fill ? 0 : 2,
			legendFormatter: legendFormatter
		});
};

const app = new Vue({
	el: '#app',
	data: {
		player: {},
		matches: [],
		graph: {
			stacked: false,
			smooth_lines: true,
			fill: false,
			percentage: false,
			num_heroes: 10,
			increment_delta: 8,
			increment_range: 24
		},
		heroes: []
	},
	computed: {
		title() {
			if (this.player && this.player.personaname) {
				return `${this.player.personaname}'s Most Played Heroes`;
			}
			else {
				return "Select a Player";
			}
		}
	},
	watch: {
		player() {
			// debounce here
			this.debouncedGetPlayerMatches();
			localStorage["player"] = JSON.stringify(this.player);
		},
		matches() {
			this.debouncedRecreateGraph(this);

			var hero_totals = {};
			this.matches.forEach(match => hero_totals[match.hero_id] = (hero_totals[match.hero_id] || 0) + 1);
			this.heroes = Object.keys(hero_totals)
				.map(key => [key, hero_totals[key]])
				.sort((key, value) =>  value[1] - key[1])
				.slice(0, this.graph.num_heroes)
				.map((hero_id, count) => hero_information[parseInt(hero_id)]);
		},
		"graph.fill": function() {
			if (this.graph.fill) {
				this.graph.smooth_lines = false;
			}
		},
		"graph.smooth_lines": function() {
			if (this.graph.smooth_lines) {
				this.graph.fill = false;
			}
		},
		graph: {
			handler() {
				this.debouncedRecreateGraph(this);
			},
			deep: true
		}
	},
	methods: {
		getPlayerMatches: function() {
			var self = this;
			axios.get(`https://api.opendota.com/api/players/${this.player.account_id}/matches`)
				.then(response => {
					var matches = response.data;
					if (matches.length > 1)
					{
						// only set matches if it was successful
						matches.sort((a, b) => a.start_time - b.start_time);
						self.matches = matches;
					}
				})
				.catch(error => alert(error));
		},
		selectedPlayer(player) {
			this.player = player;
		},
		graphClick() {
			console.log("hi");
			window.location.hash = '#app';
		}
	},
	created() {
		// fetch call here that sets products
		this.debouncedGetPlayerMatches = _.debounce(this.getPlayerMatches, 200);
		this.debouncedRecreateGraph = _.debounce(recreateGraph, 200);

		try {
			this.player = JSON.parse(localStorage["player"]);
		}
		catch(err) {
			this.player = default_player;
		}
	}
})