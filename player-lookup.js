var player_lookup_vm = Vue.component('player-lookup', {
	props: ['current_player'],
	data: function () {
		return {
			input: "",
			focused: false,
			players: [],
			status: ""
		}
	},
	watch: {
		input() {
			if (this.input.length == 0) {
				this.players = [];
				this.status = "";
			}
			else {
				this.status = "Searching...";
				this.debouncedSearchPlayers();
			}
		}
	},
	methods: {
		onFocused(event) {
			this.focused = true;
		},
		unFocus() {
			this.focused = false;
			this.input = '';
		},
		searchPlayers() {
			var self = this;
			axios.get(`https://api.opendota.com/api/search?q=${this.input}`)
				.then(response => {
					var players = response.data;
					if (players) {
						self.players = players;
						if (players.length == 0) {
							self.status = "None Found";
						}
					}
				})
				.catch(error => {
					console.log("error on search")
					// console.log(error);
				});
		},
		selectedPlayer(player) {
			this.$emit('selected-player', player);
			this.unFocus();
		}
	},
	created() {
		this.debouncedSearchPlayers = _.debounce(this.searchPlayers, 400);
		this.debouncedUnFocus = _.debounce(this.unFocus, 100);
	},
	template: `
	<div 
		class="player-lookup">
		<input
			type="text"
			:placeholder="focused ? 'Player Name or ID...' : ''"
			v-model="input"
			v-on:focus="onFocused"
			v-on:focusout="debouncedUnFocus">
		<span class="player-lookup-current" v-if="!focused">
			<img :src="current_player.avatarfull">
			<span>
				{{current_player.personaname || "Select a Player"}}
			</span>
		</span>
		<div v-if="focused">
			<div class="player-lookup-status" v-if="players.length == 0">
				{{status}}
			</div>
			<div class="player-lookup-option" v-for="player in players" v-on:click="selectedPlayer(player)">
				<img :src="player.avatarfull">
				{{player.personaname}}
			</div>
		</div>
	</div>
	`
})