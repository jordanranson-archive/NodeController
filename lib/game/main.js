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
		this.spawnEntity( 'EntityNode', 128, 128, { virus: 1, vaccine: 1, data: 5 } );
		this.spawnEntity( 'EntityNode', 896, 128, { virus: 100, vaccine: 100, data: 100 } );
		this.spawnEntity( 'EntityNode', 512, 640-96 );
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
