ig.module( 
	'game.entities.node' 
)
.requires(
	'impact.entity',
	'game.enums'
)
.defines(function(){

EntityNode = ig.Entity.extend({
	size: { x: 0, y: 0 },
	team: Color.gray,
	virus: 0,
	vaccine: 0,
	data: 10,
	threads: 0,
	backbuffer: ig.$new( 'canvas' ),
	backbufferCtx: null,

	virusAlpha: 0,
	vaccineAlpha: 0,


	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.backbuffer.width = this.backbuffer.height = 384;
		this.backbufferCtx = this.backbuffer.getContext( '2d' );

		var self = this;
		setTimeout( function() {
			self.vaccine = 15;
		}, 1000 );
	},
	

	update: function() {
		this.parent();
	},
	

	draw: function() {
		this.parent();

		var w = 192;
		var r1 = 24 + Math.min((this.data-10),40);
		var r2 = 5 + Math.min((this.vaccine),35) + r1;
		var r3 = 5 + Math.min((this.virus),80) + r2;
		var ctx = this.backbufferCtx;
		ctx.clearRect( 0, 0, 384, 384 );


		// virus
		if( this.virus > 0 ) {
			ctx.fillStyle = ctx.strokeStyle = this.team;
			ctx.lineWidth = 2;

			ctx.beginPath();
			ctx.arc( w, w, r3, 0, Math.PI*2, true ); 
			ctx.closePath();

			ctx.save();
			ctx.globalAlpha = 0.5;
			ctx.fill();
			ctx.restore();

			ctx.stroke();

			ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
		}


		// vaccine
		if( this.vaccine > 0 ) {
			ctx.fillStyle = ctx.strokeStyle = Color.black;
			ctx.lineWidth = 2;
			
			ctx.beginPath();
			ctx.arc( w, w, r2, 0, Math.PI*2, true ); 
			ctx.closePath();

			ctx.save();
			ctx.globalAlpha = 0.35;
			ctx.fill();
			ctx.restore();

			ctx.save();
			ctx.globalAlpha = 0.5;
			ctx.stroke();
			ctx.restore();

			ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
		}


		// data
		ctx.fillStyle = ctx.strokeStyle = this.team;
		ctx.beginPath();
		ctx.arc( w, w, r1, 0, Math.PI*2, true ); 
		ctx.closePath();
		ctx.fill();
		ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
	}
});

});
