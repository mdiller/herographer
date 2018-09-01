
const num_heroes = 10;
const counter_range_days = 13;
const increment_delta_days = 8;



Date.prototype.addDays = function(days) {
	var date = new Date(this.valueOf());
	date.setDate(date.getDate() + days);
	return date;
}

const is_date_in_range = (current_date, date) => {
	start = current_date.addDays(0 - counter_range_days);
	end = current_date.addDays(counter_range_days);
	return date < end && date > start;
}

function getDayString(date) {
	return date.toLocaleDateString('en-US', { 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	});
}

$.ajax({
	url: 'https://api.opendota.com/api/players/95211699/matches',
	dataType: 'json'
}).then(matches => {
	// Begin accessing JSON data here
	console.log("matches:")
	console.log(matches);
	
	console.log("heroes:")
	console.log(heroes);

	matches.forEach(match => match.date = new Date(match.start_time * 1000));

	var first_day =matches[matches.length - 1].date;
	var last_day = matches[0].date;

	var hero_totals = {}
	matches.forEach(match => hero_totals[match.hero_id] = (hero_totals[match.hero_id] || 0) + 1);
	var top_heroes = Object.keys(hero_totals)
		.map(key => [key, hero_totals[key]])
		.sort((key, value) =>  value[1] - key[1])
		.slice(0, 10)
		.map((hero, count) => parseInt(hero));

	// generate date increments
	var increment_dates = [];
	var current_date = first_day;
	while (current_date < last_day) {
		increment_dates.push(current_date);
		current_date = current_date.addDays(increment_delta_days);
	}

	var hero_infos = top_heroes.map(hero_id => {
		return {
			hero_id: hero_id,
			hero: heroes[hero_id],
			counts: increment_dates.map(date => 0)
		};
	})

	// generate hero match data
	for (var i = 0; i < increment_dates.length; i++) {
		matches.forEach(match => {
			if (is_date_in_range(increment_dates[i], match.date)) {
				hero_infos.forEach(hero_info => {
					if (hero_info.hero_id == match.hero_id) {
						hero_info.counts[i]++;
					}
				});
			}
		})
	}

	// generate hero graph data
	var data = hero_infos.map(hero_info => {
		var line = [];
		for (var i = 0; i < increment_dates.length; i++) {
			line.push({
				t: increment_dates[i],
				y: hero_info.counts[i]
			})
		}
		return {
			label: hero_info.hero.localized_name,
			data: line,
			backgroundColor: "transparent",
			borderColor: hero_info.hero.color
		}
	});

	var ctx = document.getElementById("myChart").getContext('2d');
	var myChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: increment_dates.map(getDayString),
			datasets: data
		},
		options: {
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						displayFormats: {
							quarter: 'MMM YYYY'
						}
					}
				}],
				yAxes: [{
					type: 'logarithmic'
				}]
			},
			elements: {
				point: {
					radius: 0
				}
			},
			pan: {
				enabled: true,
				mode: 'xy',
				rangeMin: {
					// Format of min pan range depends on scale type
					x: null,
					y: null
				},
				rangeMax: {
					// Format of max pan range depends on scale type
					x: null,
					y: null
				}
			},
			zoom: {
				enabled: true,
				drag: true,
				mode: 'xy',
				rangeMin: {
					x: null,
					y: null
				},
				rangeMax: {
					x: null,
					y: null
				}
			}
		}
	});

});