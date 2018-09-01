
const num_heroes = 10;
const counter_range_days = 13;
const increment_delta_days = 8;

var counter_range_seconds = counter_range_days * 86400;
var increment_delta_seconds = increment_delta_days * 86400;

const is_timestamp_in_range = (current_timestamp, timestamp) => {
	var start = current_timestamp - counter_range_seconds;
	var end = current_timestamp + counter_range_seconds;
	return timestamp < end && timestamp > start;
}

function getDayString(date) {
	return date.toLocaleDateString('en-US', { 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	});
}

function recreateGraph(matches, graph_config) {
	// matches.forEach(match => match.date = new Date(match.start_time * 1000));
	console.time("creating graph");

	var first_day = matches[0].start_time;
	var last_day = matches[matches.length - 1].start_time;

	var hero_totals = {}
	matches.forEach(match => hero_totals[match.hero_id] = (hero_totals[match.hero_id] || 0) + 1);
	var top_heroes = Object.keys(hero_totals)
		.map(key => [key, hero_totals[key]])
		.sort((key, value) =>  value[1] - key[1])
		.slice(0, 10)
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
			hero: heroes[hero_id],
			counts: increment_timestamps.map(date => 0)
		};
	})

	console.time("make increment_dates");
	// generate hero match data
	var i = 0; // increment_timestamps index
	var j = 0; // matches index
	var start_j = 0; // the start of our matches window
	for (i = 0; i < increment_timestamps.length; i++) {
		for (j = start_j; j < matches.length; j++) {
			if (is_timestamp_in_range(increment_timestamps[i], matches[j].start_time)) {
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
	console.timeEnd("make increment_dates");

	var dyData = []

	for (var i = 0; i < increment_timestamps.length; i++) {
		var column = hero_infos.map(hero_info => hero_info.counts[i]);

		// var total = column.reduce((a, b) => a + b) || 1;
		// column = column.map(v => (v * 100.0) / total)

		column.unshift(increment_dates[i]);
		dyData.push(column);
	}

	var dyLabels = hero_infos.map(hero_info => hero_info.hero.localized_name);
	dyLabels.unshift("Time");

	var dySeries = {};
	hero_infos.forEach(hero_info => {
		dySeries[hero_info.hero.localized_name] = {
			color: hero_info.hero.color,
			plotter: smoothPlotter
		}
	});

	function legendFormatter(data) {
		if (data.x == null) return '';  // no selection
		var lines = data.series.map(hero_data => {
			var hero = Object.values(heroes).find(h => h.localized_name === hero_data.label);
			return `<tr><td><img src="${hero.icon}"></td><td style='color: ${hero.color}'>${hero_data.labelHTML}</span></td><td>${hero_data.yHTML}</td></tr>`;
		});
		return `${data.xHTML}<br><table>${lines.join(" ")}</table>`;
	}
	console.timeEnd("creating graph");

	var div = document.getElementById("graphdiv");
	var graph = new Dygraph(div, 
		dyData,
		{
			fillGraph: true,
			fillAlpha: 1.0,
			stackedGraph: graph_config.stacked,
			labels: dyLabels,
			series: dySeries,
			labelsDiv: "legend",
			labelsSeparateLines: true,
			hideOverlayOnMouseOut: false,
			strokeWidth: 2,
			title: "Most Played Heroes",
			legendFormatter: legendFormatter
		});

};


// $.ajax({
// 	url: 'https://api.opendota.com/api/players/95211699/matches',
// 	dataType: 'json'
// }).then(recreateGraph);

const app = new Vue({
	el: '#app',
	data: {
		player_id: null,
		matches: [],
		graph: {
			stacked: false
		}
	},
	watch: {
		player_id: function(new_player_id, old_player_id) {
			// debounce here
			this.debouncedGetPlayerMatches();
		},
		matches: function(new_matches, old_matches) {
			this.debouncedRecreateGraph(new_matches, this.graph);
		},
		graph: {
			handler: function(new_graph, old_graph) {
				this.debouncedRecreateGraph(this.matches, new_graph);
			},
			deep: true
		}
	},
	methods: {
		getPlayerMatches: function() {
			var self = this;
			axios.get(`https://api.opendota.com/api/players/${this.player_id}/matches`)
				.then(response => {
					var matches = response.data;
					matches.sort(m => m.start_time);
					self.matches = matches;
				})
				.catch(error => alert(error));
		}
	},
	created() {
		// fetch call here that sets products
		this.debouncedGetPlayerMatches = _.debounce(this.getPlayerMatches, 200);
		this.debouncedRecreateGraph = _.debounce(recreateGraph, 200);

		this.player_id = 95211699;
	}
})