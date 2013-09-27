ig.module(
	'game.player'
)
.defines(function(){

Player = ig.Class.extend({
	team: 0,


	init: function( settings ) {
		ig.merge( this, settings );
	}
})

});
