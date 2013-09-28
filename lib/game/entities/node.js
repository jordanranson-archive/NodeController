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
	data: 5,
	threads: 0,
	backbuffer: ig.$new( 'canvas' ),
	backbufferCtx: null,

	virusAlpha: 0,
	vaccineAlpha: 0,
	virusRad: 0,
	vaccineRad: 0,
	dataRad: 10,


	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.backbuffer.width = this.backbuffer.height = 384;
		this.backbufferCtx = this.backbuffer.getContext( '2d' );

		var self = this;
		if( this.vaccine === 0 ) {
			setTimeout( function() {
				self.vaccine = 15;
			}, 2000 );
		}
	},
	

	update: function() {
		this.parent();

		if( this.virusRad < this.virus ) this.virusRad+=0.5;
		else if( this.virusRad > this.virus ) this.virusRad-=0.5;
		this.virusRad = Math.min( this.virus, this.virusRad );

		if( this.vaccineRad < this.vaccine ) this.vaccineRad+=0.5;
		else if( this.vaccineRad > this.vaccine ) this.vaccineRad-=0.5;
		this.vaccineRad = Math.min( this.vaccine, this.vaccineRad );

		if( this.dataRad < this.data ) this.dataRad+=0.5;
		else if( this.dataRad > this.data ) this.dataRad-=0.5;
		this.dataRad = Math.min( this.data, this.dataRad );
	},
	

	draw: function() {
		this.parent();

		var w = 192;
		var r1 = 24 + Math.min((this.dataRad-5),40);
		var r2 = 5 + Math.min((this.vaccineRad),35) + r1;
		var r3 = 5 + Math.min((this.virusRad),80) + r2;
		var ctx = this.backbufferCtx;
		ctx.globalAlpha = 1;

		// virus
		ctx.clearRect( 0, 0, 384, 384 );
		if( this.virus > 0 ) {
			this.virusAlpha = Math.min( this.virusAlpha+0.05, 1 );

			// virus
			ctx.fillStyle = ctx.strokeStyle = this.team;
			ctx.lineWidth = 2;

			ctx.beginPath();
			ctx.arc( w, w, r3, 0, Math.PI*2, true ); 
			ctx.closePath();

			ctx.save();
			ctx.globalAlpha = this.virusAlpha.map( 0, 1, 0, 0.5 );
			ctx.fill();
			ctx.restore();

			ctx.save();
			ctx.globalAlpha = this.virusAlpha;
			ctx.stroke();
			ctx.restore();

			// cut out
			ctx.beginPath();
			ctx.arc( w, w, r2, 0, Math.PI*2, true ); 
			ctx.closePath();

			ctx.save();
			ctx.globalCompositeOperation = 'destination-out';
			ctx.fill();
			ctx.restore();

			ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
		}
		else {
			this.virusAlpha = 0;
		}


		// vaccine
		ctx.clearRect( 0, 0, 384, 384 );
		if( this.vaccine > 0 ) {
			this.vaccineAlpha = Math.min( this.vaccineAlpha+0.05, 1 );

			ctx.fillStyle = ctx.strokeStyle = Color.black;
			ctx.lineWidth = 2;
			
			ctx.beginPath();
			ctx.arc( w, w, r2, 0, Math.PI*2, true ); 
			ctx.closePath();

			ctx.save();
			ctx.globalAlpha = this.vaccineAlpha.map( 0, 1, 0, 0.35 );
			ctx.fill();
			ctx.restore();

			ctx.save();
			ctx.globalAlpha = this.vaccineAlpha.map( 0, 1, 0, 0.5 );
			ctx.stroke();
			ctx.restore();

			ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );
		}
		else {
			this.vaccineAlpha = 0;
		}


		// data
		ctx.clearRect( 0, 0, 384, 384 );
		ctx.fillStyle = ctx.strokeStyle = this.team;
		ctx.beginPath();
		ctx.arc( w, w, r1, 0, Math.PI*2, true ); 
		ctx.closePath();
		ctx.fill();
		ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w );

		ig.game.fonts.latoLight.draw( 
			this.data, 
			this.pos.x, 
			this.pos.y-(ig.game.fonts.latoLight.heightForString(this.data.toString())*0.5)+1,
			ig.Font.ALIGN.CENTER
		);
	}
});

});
