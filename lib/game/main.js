ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',

	'game.enums',
	'game.entities.node',

	'fss.fss'
)
.defines(function(){

Game = ig.Game.extend({
	clearColor: '#222',
	fonts: {
		lato: new ig.Font( 'media/lato.png' ),
		latoLight: new ig.Font( 'media/lato-light.png' )
	},


	init: function() {
		ig.system.drawMode = ig.System.DRAW.SUBPIXEL;
		
		this.spawnEntity( 'EntityNode', 0, 0 );
	},
	

	update: function() {
		this.parent();
	},
	

	draw: function() {
		this.parent();
		
		var x = ig.system.width/2,
			y = ig.system.height/2;
	}
});

ig.main( '#canvas', Game, 60, 1024, 768, 1 );

});
