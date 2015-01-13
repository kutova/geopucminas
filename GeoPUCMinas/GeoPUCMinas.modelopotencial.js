// --------------------------------------------------------------------------------------
// MODELO POTENCIAL DE INTERAÇÃO ESPACIAL
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.potenciais = function( massa, constantes ) {

	// contantes
	if( constantes == undefined ) {
		var constantes = {
			K: 1,
			b: 2,
			p: 2		// potencial próprio
		};
	} else {
		if( constantes.K == undefined )
			constantes.K= 1;
		if( constantes.b == undefined )
			constantes.b = 2;
		if( constantes.p == undefined )
			constantes.p = 1;
	}
	
	/*
	// Cria a janela de calibragem -------------------------------------------------------
	var janelaCalibragem = document.createElement( 'div' );
	janelaCalibragem.innerHTML = '<div id="gpmParametrosPotencial" class="reveal-modal medium"><div class="row"><div class="small-12 large-12 columns"><div class="row"><div class="small-12 large-12 columns"><h3>Parâmetros do modelo potencial</h3><a class="close-reveal-modal">&#215;</a></div></div><div class="row"><div class="large-12 columns"><form class="custom"><p style="margin-top:2em">Cálculo do potencial próprio:</p><div class="row" id="rppi"><div class="large-4 columns"><label for="rpp"><input name="rpp" type="radio" id="rpp1" value="1" style="display:none;" CHECKED><span class="custom radio checked"></span> &nbsp; <img src="img/pp1.gif" /></label></div><div class="large-4 columns"><label for="rpp"><input name="rpp" type="radio" id="rpp2" value="2" style="display:none;"><span class="custom radio"></span> &nbsp; <img src="img/pp2.gif" /></label></div><div class="large-4 columns"><label for="rpp"><input name="rpp" type="radio" id="rpp3" value="3" style="display:none;"><span class="custom radio"></span> &nbsp; <img src="img/pp3.gif" /></label></div></div><p style="margin-top:2em">Constantes para cálculo das interações:</p><div class="row"><div class="large-6 columns"><p style="text-align:center"><img src="img/pi.gif" /></p></div><div class="large-6 columns"><div class="row collapse"><div class="small-6 large-6 columns"><span class="prefix">K</span></div><div class="small-6 large-6 columns"><input type="text" id="gpmPotencialK"/></div></div><div class="row collapse"><div class="small-6 large-6 columns"><span class="prefix">b</span></div><div class="small-6 large-6 columns"><input type="text" id="gpmPotencialB"/></div></div></div></div><div class="row"><div class="small-12 large-12 columns"><p style="margin-top:2em"><strong>Obs.:</strong> A distância considerada entre os municípios é a distância euclidiana entre suas sedes.</p></div></div></form></div></div><div class="row"><div class="small-12 large-12 columns"><p><button id="gpmPotencialOK">Recalcular</button><button class="secondary" id="gpmPotencialCancela">Cancelar</button></p></div></div></div></div></div>';
	document.body.appendChild( janelaCalibragem );
	
	// Funções da janela de calibragem ---------------------------------------------------
	if( $( '#gpmCalibragemPotencial-'+mapa ).length > 0 ) {
		$( "#gpmParametrosPotencial" ).foundation();
		$( '#gpmCalibragemPotencial-'+mapa ).click(function() {
			$('#gpmPotencialK').val( constantes.K );
			$('#gpmPotencialB').val( constantes.b );			
			$('#gpmParametrosPotencial').foundation( 'reveal', 'open');
		});

		$( '#gpmPotencialOK' ).click(function() {
			constantes.K = parseFloat($('#constanteK').val());
			constantes.b = parseFloat($('#constanteB').val());
			constantes.p = parseInt( $('#rppi input:checked').val() );
			
			// Falta ver como faz para atualizar o modelo.
						
			$('#gpmParametrosPotencial').foundation( 'reveal', 'close');
		} );
		$( '#gpmPotencialCancela' ).click(function() {
			$('#gpmParametrosPotencial').foundation( 'reveal', 'close');
		} );
	}
	
	*/
	
	return this.calculaPotenciais( massa, constantes );
}


GeoPUCMinas.prototype.calculaPotenciais = function( massa, constantes ) {

	// calcula a matriz de distâncias
	var rlat = this.rótulosMunicípios.indexOf( 'Lat' );
	var rlng = this.rótulosMunicípios.indexOf( 'Long' );
	var rarea = this.rótulosMunicípios.indexOf( 'Área' );
	var i,j;
	var distancias = new Object();
	for( i in massa ) {
		distancias[i] = new Object();
		for( j in massa ) {
			distancias[i][j] = distancia(
				this.dadosMunicípios[i][rlat],
				this.dadosMunicípios[i][rlng],
				this.dadosMunicípios[j][rlat],
				this.dadosMunicípios[j][rlng]
			);
//			distancias[i][j] = Math.sqrt( 
//				Math.pow( this.dadosMunicípios[i][rlat]-this.dadosMunicípios[j][rlat], 2 ) +
//				Math.pow( this.dadosMunicípios[i][rlng]-this.dadosMunicípios[j][rlng], 2 )
//			);
		}
	}

	// Calcula os potenciais de cada município
	var potenciais = new Object();
	for( i in massa ) {
		potenciais[i] = 0;
		for( j in massa )
			if( i!=j )
				potenciais[i] += massa[j] / Math.pow(distancias[i][j],constantes.b);
		potenciais[i] *= constantes.K;

		if( constantes.p==3 )
			potenciais[i] += massa[i] / (0.5*Math.sqrt(this.dadosMunicípios[i][rarea]/Math.PI));
		else if( constantes.p==2 )
			potenciais[i] += massa[i] / Math.sqrt(this.dadosMunicípios[i][rarea]);
		else
			potenciais[i] += massa[i];
	}		
	
	return potenciais;
}


function distancia( lat1, lng1, lat2, lng2 ) {
	var R = 6371; // km
	lat1 = lat1*(Math.PI/180);
	lng1 = lng1*(Math.PI/180);
	lat2 = lat2*(Math.PI/180);
	lng2 = lng2*(Math.PI/180);
	
	var dLat = lat2-lat1;
	var dLng = lng2-lng1;

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c;
	return d*1000;  // distância calculada em metros
}

