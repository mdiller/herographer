var PARAMETERS_DEFINITION = [
	{
		name: "player",
		label: "Player",
		type: "select-search",
		placeholder: "Player Name or Steam ID...",
		nullable: null,
		default: null
	},
	{
		name: "smooth_lines",
		label: "Smooth Lines",
		type: "checkbox",
		default: true
	},
	{
		name: "stacked",
		label: "Stacked",
		type: "checkbox",
		default: false
	},
	{
		name: "fill",
		label: "Fill",
		type: "checkbox",
		default: false
	},
	{
		name: "percentage",
		label: "Percentage",
		type: "checkbox",
		default: false
	},
	{
		name: "increment_delta",
		label: "Increment Delta",
		type: "numerical",
		default: 8,
		min: 1
	},
	{
		name: "increment_range",
		label: "Increment Range",
		type: "numerical",
		default: 24,
		min: 1
	}
]