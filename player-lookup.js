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
		startEdit() {
			this.focused = true;
			this.$refs.input.focus();
		},
		endEdit() {
			this.focused = false;
			this.input = '';
			this.$refs.input.blur();
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
					console.log("error on search");
					// console.log(error);
				});
		},
		selectedPlayer(player) {
			if (player) {
				this.$emit('update:current_player', player);
				this.endEdit();
			}
		}
	},
	created() {
		this.debouncedSearchPlayers = _.debounce(this.searchPlayers, 400);
	},
	template: `
	<div 
		@click="startEdit"
		@focus="startEdit"
		class="player-lookup">
		<input
			ref="input"
			type="text"
			:placeholder="focused ? 'Player Name or ID...' : ''"
			v-model="input"
			@focus.prevent="startEdit"
			@blur="endEdit"
			@keyup.esc="endEdit"
			@keyup.enter="selectedPlayer(players[0])">
		<span class="player-lookup-current" v-if="!focused">
			<img :src="current_player.avatarfull">
			<span>
				{{current_player.personaname || "Select a Player"}}
			</span>
		</span>
		<div v-if="focused" @mousedown.prevent>
			<div class="player-lookup-status" v-if="players.length == 0" @mousedown.prevent>
				{{status}}
			</div>
			<div 
				class="player-lookup-option" 
				v-for="player in players" 
				@click.stop="selectedPlayer(player)"
				@mousedown.prevent>
				<img :src="player.avatarfull">
				{{player.personaname}}
			</div>
		</div>
	</div>
	`
})