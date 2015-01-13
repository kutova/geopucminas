// --------------------------------------------------------------------------------------
// adicionaInterpolação()
// apresentação do mapa isoplético
// --------------------------------------------------------------------------------------
GeoPUCMinas.prototype.adicionaInterpolação = function( mapa, opcoes ) {
	var nMapa = null;
	for( i=0; i<this.coleçãoMapas.length; i++ )
		if( this.coleçãoMapas[i].elemento == mapa ) {
			nMapa = i;
			break;
		}
	if( nMapa != null )
		this.isopletico = new this.kriging( nMapa, opcoes );
	else
		console.log( 'Identificador de mapa inválido' );
}

// ---------------------------------------------------------------------------------------
// GeoPUCMinas.kriging()
// Objeto que contém os valores, as configurações e as operações para uma 
// interpolação pelo método Kriging
//
// Adaptação do código de Omar E. Olmedo (https://github.com/oeo4b/kriging.js)
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.kriging = function( mapa, opcoes ) {

	// Cria a janela de calibragem
	var janelaCalibragem = document.createElement( 'div' );
	janelaCalibragem.innerHTML = '<div id="gpmCalibragemKriging" class="reveal-modal large"><div class="row"><div class="small-12 large-12 columns"><div class="row"><div class="small-12 large-12 columns"><h3>Calibragem</h3><a class="close-reveal-modal">&#215;</a></div></div><div class="row"><div class="large-6 columns"><form class="custom"><div class="row collapse"><div class="small-6 large-6 columns"><span class="prefix">Modelo</span></div><div class="small-6 large-6 columns"><select id="krig_model" class="gpmKrigingClass"><option value="esférico" selected>Esférico</option><option value="exponencial">Exponencial</option><option value="gaussiano">Gaussiano</option><option value="linear">Linear</option></select></div></div><div class="row collapse"><div class="small-6 large-6 columns"><span class="prefix">Nugget</span></div><div class="small-6 large-6 columns"><input type="text" id="krig_nugget" class="gpmKrigingClass"/></div></div><div class="row collapse"><div class="small-6 large-6 columns"><span class="prefix">Sill</span></div><div class="small-6 large-6 columns"><input type="text" id="krig_sill" class="gpmKrigingClass"/></div></div><div class="row collapse"><div class="small-6 large-6 columns"><span class="prefix">Range</span></div><div class="small-6 large-6 columns"><input type="text" id="krig_range" class="gpmKrigingClass"/></div></div><div class="row collapse"><div class="small-6 large-6 columns"><span class="prefix">Lags</span></div><div class="small-6 large-6 columns"><input type="text" id="krig_lags" class="gpmKrigingLags"/></div></div></form></div><div class="large-6 columns"><canvas width="250px" height="250px" style="border:thin black solid" id="canvasplot"></canvas></div></div><div class="row"><div class="small-12 large-12 columns"><p><button id="gpmCalibragemKrigingBtOK">Recalcular</button><button class="secondary"  id="gpmCalibragemKrigingBtCancel">Cancelar</button></p></div></div></div></div></div>';
	document.body.appendChild( janelaCalibragem );

	// Funções da janela de calibragem ---------------------------------------------------
	var jCalibragem = $( "button[data-geopucminas='calibragem-kriging']" ); //[data-mapa='"+__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['elemento']+"']" );
	if( jCalibragem.length > 0 ) {
		$( "#gpmCalibragemKriging" ).foundation();
		$( jCalibragem ).click(function() {
			$('#krig_model').val( __gpmAutoRef.isopletico.parametros.modelo );
			$('#krig_nugget').val( __gpmAutoRef.isopletico.parametros.nugget );
			$('#krig_sill').val( __gpmAutoRef.isopletico.parametros.sill );
			$('#krig_range').val( __gpmAutoRef.isopletico.parametros.range );
			$('#krig_lags').val( __gpmAutoRef.isopletico.parametros.lags );
			$('#gpmCalibragemKriging').foundation( 'reveal', 'open');
			Foundation.libs.forms.refresh_custom_select($("#krig_model"),true);
			__gpmAutoRef.isopletico.plot( 'canvasplot' );
		});

		$('.gpmKrigingClass').change( function() {
			var mapa = __gpmAutoRef.isopletico.parametros.númeroMapa;
			var opcoes = {
			    variável: __gpmAutoRef.isopletico.parametros.variável,
			    modelo: $('#krig_model').val(),
			    nugget: parseFloat($('#krig_nugget').val()),
			    sill: parseFloat($('#krig_sill').val()),
			    range: parseFloat($('#krig_range').val()),
			    lags: parseFloat($('#krig_lags').val())
			}
			__gpmAutoRef.isopletico.plot( 'canvasplot', opcoes );
		} );
		$('.gpmKrigingLags').change( function() {
			var mapa = __gpmAutoRef.isopletico.parametros.númeroMapa;
			var opcoes = {
			    variável: __gpmAutoRef.isopletico.parametros.variável,
			    modelo: $('#krig_model').val(),
			    nugget: parseFloat($('#krig_nugget').val()),
			    sill: parseFloat($('#krig_sill').val()),
			    range: parseFloat($('#krig_range').val()),
			    lags: parseFloat($('#krig_lags').val())
			}
			__gpmAutoRef.isopletico.configura( mapa, opcoes );
			__gpmAutoRef.isopletico.plot( 'canvasplot' );
		} );
	

		$('#gpmCalibragemKrigingBtOK').click( function() {
			var mapa = __gpmAutoRef.isopletico.parametros.númeroMapa;
			var opcoes = {
			    variável: __gpmAutoRef.isopletico.parametros.variável,
			    modelo: $('#krig_model').val(),
			    nugget: parseFloat($('#krig_nugget').val()),
			    sill: parseFloat($('#krig_sill').val()),
			    range: parseFloat($('#krig_range').val()),
			    lags: parseFloat($('#krig_lags').val())
			}
			__gpmAutoRef.isopletico.removeInterpolacao();
			__gpmAutoRef.isopletico.configura( mapa, opcoes );
			__gpmAutoRef.isopletico.interpola();  
			$('#gpmCalibragemKriging').foundation( 'reveal', 'close');
		});

		$('#gpmCalibragemKrigingBtCancel').click( function() {
			$('#gpmCalibragemKriging').foundation( 'reveal', 'close');
		});
	};


	// Parâmetros e dados para a interpolação
	__gpmAutoRef.isopletico = this;
	if( opcoes == undefined )
		opcoes = {};
	this.parametros = new Object();
	this.configura( mapa, opcoes );
	this.interpola();
	
}

// ---------------------------------------------------------------------------------------
// GeoPUCMinas.kriging.configura()
// Recebe os parâmetros para configuração do modelo
// Parâmetros
//		mapa		- número do mapa na coleção que será usado na interpolação
//      opcoes		- lista de opções contendo:
//			variável	- índice da variável que será usada na interpolação
//			modelo		- modelo matemático que será usado na interpolação ('esférico', 'linear', 'exponencial', 'gaussiano' )
//			lags		- número de faixas usadas no semivariograma
//			nugget		- valor do efeito pepita (opcional - se não for passado, será a menor semivariância entre os pontos de controle)
//			sill		- valor do patamar (opcional - se não for passado, será a diferença entre a maior e a menor semivariâncias entre os pontos de controle)
//			range		- valor do alcance (opcional - se não for passado, será a maior distância entre os pontos de controle)
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.kriging.prototype.configura = function( mapa, opcoes ) {

	// Parâmetros iniciais do modelo
	if( opcoes.modelo != undefined )
		this.parametros.modelo = opcoes.modelo;
	else
		this.parametros.modelo = 'esférico';
		
	if( opcoes.lags != undefined )
		this.parametros.lags = opcoes.lags;
	else
		this.parametros.lags = 10;
		
	if( opcoes.variável != undefined )
		this.parametros.variável = opcoes.variável;
	else
		this.parametros.variável = __gpmAutoRef.coleçãoMapas[mapa]['variávelSelecionada'];

	// Carrega as coordenadas e valores do mapa selecionado. 
	// 		coordenadas - vetor de pares de [ longitude, latitude ] para os pontos de controle
	//		valores		- valores dos pontos de controle
	var coordenadas = new Array();
	var valores = new Array();
	
	// Prepara os dados, considerando os mecanismos de filtragem
	this.dadosMapa = new Object();
	var minimo = __gpmAutoRef.coleçãoMapas[mapa]['mínimo'];
	var maximo = __gpmAutoRef.coleçãoMapas[mapa]['máximo'];
	var meso = __gpmAutoRef.coleçãoMapas[mapa]['meso'];
	var micro = __gpmAutoRef.coleçãoMapas[mapa]['micro'];
	var rótuloMicro = __gpmAutoRef.rótulosMunicípios.indexOf('Código Micro');
	var rótuloMeso = __gpmAutoRef.rótulosMunicípios.indexOf('Código Meso');
	for( i in __gpmAutoRef.coleçãoMapas[mapa]['dados'][this.parametros.variável] )
		if(  (minimo==-1 || __gpmAutoRef.coleçãoMapas[mapa]['dados'][__gpmAutoRef.coleçãoMapas[mapa][this.parametros.variável]][i]>=minimo ) &&
			 (maximo==-1 || __gpmAutoRef.coleçãoMapas[mapa]['dados'][__gpmAutoRef.coleçãoMapas[maoa][this.parametros.variável]][i]<=maximo ) &&
			 (micro==null || __gpmAutoRef.dadosMunicípios[i][rótuloMicro]==micro ) &&
			 (meso==null  || __gpmAutoRef.dadosMunicípios[i][rótuloMeso]==meso ) )
			 this.dadosMapa[i] = __gpmAutoRef.coleçãoMapas[mapa]['dados'][this.parametros.variável][i];
	
	for( i in this.dadosMapa ) {
		coordenadas.push( [ 
			geometriaMunicipios[__gpmAutoRef.uf][i][__gpmAutoRef.rótulosMunicípios.indexOf('Long')], 
			geometriaMunicipios[__gpmAutoRef.uf][i][__gpmAutoRef.rótulosMunicípios.indexOf('Lat')]
		] );
		valores.push( this.dadosMapa[i] );
	}

	this.parametros.mapa = __gpmAutoRef.coleçãoMapas[mapa];
	this.parametros.númeroMapa = mapa;
	this.parametros.coordenadas = coordenadas;
	this.parametros.valores = valores;
	this.parametros.valorMinimo = this.min(valores);
	this.parametros.valorMaximo = this.max(valores);
	this.parametros.valorDiferençaMaxima = this.parametros.valorMaximo - this.parametros.valorMinimo;
	this.poligonos = new Array();

	// Determina a distância euclidiana entre as coordenadas dos pontos de controle e 
	// as diferenças entre os seus valores -----------------------------------------------
	this.parametros.n = valores.length;
	var i, j, k;
	var distanciasPC = new Array( this.parametros.n );
	var diferencasPC = new Array( this.parametros.n );
	var distanciaMaxima = -Infinity;
	var distanciaMinima = Infinity;
	for( i=0; i<this.parametros.n; i++ ) {
		distanciasPC[i] = new Array( this.parametros.n );
		diferencasPC[i] = new Array( this.parametros.n );
		for( j=0; j<this.parametros.n; j++ ) {
			distanciasPC[i][j] = Math.sqrt(Math.pow(this.parametros.coordenadas[i][0] - this.parametros.coordenadas[j][0], 2) + Math.pow(this.parametros.coordenadas[i][1] - this.parametros.coordenadas[j][1], 2));
			if( distanciasPC[i][j] > distanciaMaxima ) distanciaMaxima = distanciasPC[i][j];
			if( distanciasPC[i][j] < distanciaMinima ) distanciaMinima = distanciasPC[i][j];
			diferencasPC[i][j] = Math.abs( this.parametros.valores[i] - this.parametros.valores[j] );
		}
	}
	

/*  
// FUTURA MUDANÇA DE CÓDIGO PARA AJUSTE AO MODELO CLÁSSICO DE KRIGING
// O modelo do Omar usa Indicator Kriging


	// Calcula as semivariancias entre os pontos de controle -----------------------------
	this.parametros.semivariancias = new Array();
	this.parametros.distancias = new Array();
	var sum_z = new Array( this.parametros.lags );
	var n_h = new Array( this.parametros.lags );
	for (i = 0; i < this.parametros.lags; i++) {
		sum_z[i] = 0;
		n_h[i] = 0;
	}
	var tamanhoLag = distanciaMaxima/this.parametros.lags;
	for( j=0; j<this.parametros.n-1; j++ ) {
		for( k=j+1; k < this.parametros.n; k++ ) {
			nLag = Math.ceil( distanciasPC[j][k]/tamanhoLag );
			sum_z[nLag-1] += Math.pow(diferencasPC[j][k], 2);
			n_h[nLag-1]++;
		}
	}
	for (i = 0; i < this.parametros.lags; i++) {
		if (!isNaN(sum_z[i] / n_h[i])) {
			this.parametros.semivariancias.push(sum_z[i] / (2*n_h[i]) );
			this.parametros.distancias.push( (i+0.5)*tamanhoLag);
		}
	}
*/	
	
	// código anterior para cada lag
	var sum_z, n_h;
	this.parametros.semivariancias = new Array();
	this.parametros.distancias = new Array();
	
	var xmax = -Infinity,
		ymax = -Infinity,
		xmin = Infinity,
		ymin = Infinity;
	for( i=0; i<this.parametros.coordenadas.length; i++ ) {
		if( this.parametros.coordenadas[i][0] > xmax ) xmax = this.parametros.coordenadas[i][0];
		if( this.parametros.coordenadas[i][1] > ymax ) ymax = this.parametros.coordenadas[i][1];
		if( this.parametros.coordenadas[i][0] < xmin ) xmin = this.parametros.coordenadas[i][0];
		if( this.parametros.coordenadas[i][1] < ymin ) ymin = this.parametros.coordenadas[i][1];
	}

	var cutoff = Math.sqrt(Math.pow(xmax-xmin, 2) + Math.pow(ymax-ymin, 2)) / 3;
	for (i = 0; i < this.parametros.lags; i++) {
		sum_z = 0;
		n_h = 0;
		for (j = 0; j < this.parametros.n; j++) {
			for (k = j + 1; k < this.parametros.n; k++) {
				if (distanciasPC[j][k] <= ((i + 1) * cutoff / this.parametros.lags)) {
					sum_z += Math.pow(diferencasPC[j][k], 2);
					n_h++;
				}
			}
		}
		if (!isNaN(sum_z / n_h)) {
			this.parametros.semivariancias.push(sum_z / n_h);
			this.parametros.distancias.push((i + 1) * cutoff / this.parametros.lags);
		}
	}

//	console.log( 'semivariancias', this.parametros.semivariancias );
//	console.log( 'distancias', this.parametros.distancias );

	/* Check for enough points in the lag model */
	if (this.parametros.semivariancias.length < 3) {
		console.log( 'Erro na interpolação por kriging: não há pontos suficientes para o cálculo');
		return;
		/* ERROR -- quit app */
	}

	/* Estimate the model parameters */
	if( opcoes.nugget != undefined )
		this.parametros.nugget = opcoes.nugget;
	else
		this.parametros.nugget = 0;
	if( opcoes.range != undefined )
		this.parametros.range = opcoes.range;
	else
		this.parametros.range = this.max( this.parametros.distancias );
	if( opcoes.sill != undefined )
		this.parametros.sill = opcoes.sill;
	else
		this.parametros.sill = this.max(this.parametros.semivariancias);
		
//	console.log( 'nugget', this.parametros.nugget );
//	console.log( 'sill', this.parametros.sill );
//	console.log( 'range', this.parametros.range );

	/**
	 * Calculate the inverted (n+1) x (n+1) matrix
	 * Used to calculate weights
	 */
	var X = new Array(this.parametros.n + 1);
	for (i = 0; i <= this.parametros.n; i++) {
		X[i] = new Array(this.parametros.n + 1);
		for (j = 0; j <= this.parametros.n; j++) {
			if (i == this.parametros.n && j != this.parametros.n) 
				X[i][j] = 1;
			else {
				if (i != this.parametros.n && j == this.parametros.n) 
					X[i][j] = 1;
				else {
					if (i == this.parametros.n && j == this.parametros.n) 
						X[i][j] = 0;
					else {
						if( this.parametros.modelo == 'esférico' )
							X[i][j] = this.spherical(distanciasPC[i][j]);
						else if(  this.parametros.modelo == 'gaussiano' )
							X[i][j] = this.gaussian(distanciasPC[i][j]);
						else if(  this.parametros.modelo == 'exponencial' )
							X[i][j] = this.exponential(distanciasPC[i][j]);
						else // linear
							X[i][j] = this.linear(distanciasPC[i][j]);
					}
				}
			}
		}
	}

	/* Invert the matrix */
	this.X_inv = R_solve(X);
}

/* Variogram models */
GeoPUCMinas.prototype.kriging.prototype.exponential = function (h, nugget, sill, range ) {
	if( nugget == undefined ) {
		nugget = this.parametros.nugget;
		sill = this.parametros.sill;
		range = this.parametros.range;
	}
	if (h == 0) return 0;
	else {
		return nugget + (sill - nugget) * (1 - Math.exp((-3 * Math.abs(h)) / range));
	}
}

GeoPUCMinas.prototype.kriging.prototype.spherical = function (h, nugget, sill, range ) {
	if( nugget == undefined ) {
		nugget = this.parametros.nugget;
		sill = this.parametros.sill;
		range = this.parametros.range;
	}
	if (h == 0) return 0;
	if (h > range) return sill;
	return nugget + (sill-nugget) * ((3 * h) / (2 * range) - Math.pow(h, 3) / (2 * Math.pow(range, 3)));
}

GeoPUCMinas.prototype.kriging.prototype.gaussian = function (h, nugget, sill, range ) {
	if( nugget == undefined ) {
		nugget = this.parametros.nugget;
		sill = this.parametros.sill;
		range = this.parametros.range;
	}
	if (h == 0) return 0;
	else {
		return nugget + (sill - nugget) * (1 - Math.exp((-1 * Math.pow(h,2)) / Math.pow(range,2)));
	}
}

GeoPUCMinas.prototype.kriging.prototype.linear = function (h, nugget, sill, range ) {
	if( nugget == undefined ) {
		nugget = this.parametros.nugget;
		sill = this.parametros.sill;
		range = this.parametros.range;
	}
	if (h == 0) 
		return 0;
	else {
		if (h > range) return sill;
		else {
			return nugget + (sill - nugget) * (Math.abs(h)/range);
		}
	}
}


/* Model prediction method */
GeoPUCMinas.prototype.kriging.prototype.pred = function (x, y) {
	var i, d;
	var L = R_rep(1, this.parametros.n + 1);
	for (i = 0; i < this.parametros.n; i++) {
		d = Math.sqrt(Math.pow(this.parametros.coordenadas[i][0] - x, 2) + Math.pow(this.parametros.coordenadas[i][1] - y, 2));
		if( this.parametros.modelo == 'esférico' )
			L[i] = this.spherical(d);
		else if( this.parametros.modelo == 'gaussiano' )
			L[i] = this.gaussian(d);
		else if( this.parametros.modelo == 'exponencial' )
			L[i] = this.exponential(d);
		else
			L[i] = this.linear(d);
	}
	var R = matrixmult(this.X_inv, [L])[0];
	R.pop();
	return matrixmult(R_t([R]), [this.parametros.valores])[0][0];
}

/**
* Gera uma representação gráfica da distribuição de semivariâncias
*/
GeoPUCMinas.prototype.kriging.prototype.plot = function( pcanvasid, opcoes ) {

	// Parâmetros iniciais do modelo
	var pmodel, pnugget, psill, prange;
	pmodel = this.parametros.modelo;
	pnugget = this.parametros.nugget;
	psill = this.parametros.sill;
	prange = this.parametros.range;
	if( opcoes != undefined ) {
		if( opcoes.modelo != undefined )
			pmodel = opcoes.modelo;
		if( opcoes.nugget != undefined )
			pnugget = opcoes.nugget;
		if( opcoes.sill != undefined )
			psill = opcoes.sill;
		if( opcoes.range != undefined )
			prange = opcoes.range;
	}


	var canvasPlot = document.getElementById(pcanvasid);
	var ctxPlot = canvasPlot.getContext('2d');
	ctxPlot.clearRect(0,0,canvasPlot.width,canvasPlot.height);

	var x0_p = 40, 
		x1_p = canvasPlot.width-40, 
		y0_p = canvasPlot.height-40, 
		y1_p = 40;
	var x0_v = 0, 
		x1_v = this.max(this.parametros.distancias),
		y0_v = 0, 
		y1_v = this.max(this.parametros.semivariancias);
		
	// desenha os eixos
	ctxPlot.strokeStyle = "black";
	ctxPlot.fillStyle = "black";
	ctxPlot.beginPath();
	ctxPlot.moveTo(x0_p,y0_p+5);
	ctxPlot.lineTo(x0_p,y1_p);
	ctxPlot.moveTo(x0_p-5,y0_p);
	ctxPlot.lineTo(x1_p,y0_p);
	ctxPlot.moveTo(x0_p-5,y1_p);
	ctxPlot.lineTo(x0_p+5,y1_p);
	ctxPlot.closePath();
	ctxPlot.stroke();
	ctxPlot.font = "10pt Verdana";
	ctxPlot.fillText( "0", x0_p-20, y0_p+20 );
	ctxPlot.fillText( (Math.round(x1_v*100)/100)+"º", x1_p-20, y0_p+20 );
	ctxPlot.fillText( (Math.round(y1_v*100)/100), x0_p-20, y1_p-10 );
	
	// desenha o gráfico
	ctxPlot.beginPath();
	for( i=0; i<this.parametros.distancias.length; i++ ) {
		ctxPlot.moveTo(x0_p+(this.parametros.distancias[i]/x1_v)*(x1_p-x0_p),y0_p-5);
		ctxPlot.lineTo(x0_p+(this.parametros.distancias[i]/x1_v)*(x1_p-x0_p),y0_p+5);
	}
	for( i=0; i<this.parametros.semivariancias.length; i++ ) {
		ctxPlot.moveTo(x0_p-5,y0_p-(this.parametros.semivariancias[i]/y1_v)*(y0_p-y1_p));
		ctxPlot.lineTo(x0_p+5,y0_p-(this.parametros.semivariancias[i]/y1_v)*(y0_p-y1_p));
	}
	ctxPlot.stroke();

	// marca os pontos
	for( i=0; i<this.parametros.semivariancias.length; i++ )  {
		ctxPlot.beginPath();
		ctxPlot.arc(x0_p+(this.parametros.distancias[i]/x1_v)*(x1_p-x0_p),y0_p-(this.parametros.semivariancias[i]/y1_v)*(y0_p-y1_p),3,0,2*Math.PI,false);
		ctxPlot.fill();
	}
	
	// traça a curva
	var vp=0;
	var nPassos = 50;
	var passo = (1/nPassos)*(x1_p-x0_p);
	ctxPlot.beginPath();
	for( i=0; i<nPassos; i++ ) {
		if( pmodel == 'esférico' )
			vp = this.spherical(x1_v*(i/nPassos), pnugget, psill, prange );
		else if( pmodel == 'gaussiano' )
			vp = this.gaussian(x1_v*(i/nPassos), pnugget, psill, prange );
		else if( pmodel == 'exponencial' )
			vp = this.exponential(x1_v*(i/nPassos), pnugget, psill, prange );
		else
			vp = this.linear(x1_v*(i/nPassos), pnugget, psill, prange );
		if(i==0)
			ctxPlot.moveTo(x0_p+i*passo,y0_p-(vp/y1_v)*(y0_p-y1_p));
		else
			ctxPlot.lineTo(x0_p+i*passo,y0_p-(vp/y1_v)*(y0_p-y1_p));
	}
	ctxPlot.stroke();
}


// ---------------------------------------------------------------------------------------
// GeoPUCMinas.kriging.interpola()
// Recebe os parâmetros para configuração do modelo
// Parâmetros
// 		densidade - quantidade de pontos por grau que serão usados na interpolação
//		min		  - valor mínimo (o valor de cada ponto não pode ser inferior a ele)
//		max		  - valor máximo (o valor de cada ponto não pode ser superior a ele)
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.kriging.prototype.interpola = function( geometriaRegiao, densidade, min, max ) {

	if( densidade == undefined )
		densidade = 100;
		
	// Determina a quantidade de pontos a serem interpolados
	var nx = Math.ceil((this.parametros.mapa.limites.leste - this.parametros.mapa.limites.oeste)*densidade);
	var ny = Math.ceil((this.parametros.mapa.limites.norte - this.parametros.mapa.limites.sul)*densidade);
	var passox = (this.parametros.mapa.limites.leste - this.parametros.mapa.limites.oeste)/nx;
	var passoy = (this.parametros.mapa.limites.norte - this.parametros.mapa.limites.sul)/ny;
	

	// Calcula os limites dos polígonos a serem usados na verificação dos pontos internos
	var i, j;
	this.poligonosCoropletico = new Object();
	for( i in this.dadosMapa ) {
		this.poligonosCoropletico[i] = new Object();
		this.poligonosCoropletico[i].geometria = geometriaMunicipios[__gpmAutoRef.uf][i][__gpmAutoRef.rótulosMunicípios.indexOf( "Geometria" )];
		
		this.poligonosCoropletico[i].xmin = Infinity;
		this.poligonosCoropletico[i].ymin = Infinity;
		this.poligonosCoropletico[i].xmax = -Infinity;
		this.poligonosCoropletico[i].ymax = -Infinity;
		for( j=0; j<this.poligonosCoropletico[i].geometria.length; j++ ) {
			if( this.poligonosCoropletico[i].geometria[j][0] < this.poligonosCoropletico[i].xmin ) this.poligonosCoropletico[i].xmin = this.poligonosCoropletico[i].geometria[j][0];
			if( this.poligonosCoropletico[i].geometria[j][0] > this.poligonosCoropletico[i].xmax ) this.poligonosCoropletico[i].xmax = this.poligonosCoropletico[i].geometria[j][0];
			if( this.poligonosCoropletico[i].geometria[j][1] < this.poligonosCoropletico[i].ymin ) this.poligonosCoropletico[i].ymin = this.poligonosCoropletico[i].geometria[j][1];
			if( this.poligonosCoropletico[i].geometria[j][1] > this.poligonosCoropletico[i].ymax ) this.poligonosCoropletico[i].ymax = this.poligonosCoropletico[i].geometria[j][1];
		}
	}

	// Interpolação dos pontos da grade
	var nx = Math.ceil((this.parametros.mapa.limites.leste - this.parametros.mapa.limites.oeste)*densidade);
	var ny = Math.ceil((this.parametros.mapa.limites.norte - this.parametros.mapa.limites.sul)*densidade);
	var passox = (this.parametros.mapa.limites.leste - this.parametros.mapa.limites.oeste)/nx;
	var passoy = (this.parametros.mapa.limites.norte - this.parametros.mapa.limites.sul)/ny;
	var grade = new Array();
	for( x=0; x<nx; x++ ) {
		grade[x] = new Array();
		for( y=0; y<ny; y++ ) {
			px=x*passox+this.parametros.mapa.limites.oeste;
			py=y*passoy+this.parametros.mapa.limites.sul;
			pinterno = false;
			for( i in this.poligonosCoropletico ) {
				if( px>=this.poligonosCoropletico[i].xmin && px<=this.poligonosCoropletico[i].xmax &&
					py>=this.poligonosCoropletico[i].ymin && py<=this.poligonosCoropletico[i].ymax )
					if( pip( this.poligonosCoropletico[i].geometria, px, py ) ) {
						pinterno=true;
					}
			}
			
			if( pinterno ) {
				grade[x][y] = this.pred(
									x*passox+this.parametros.mapa.limites.oeste,
									y*passoy+this.parametros.mapa.limites.sul
								);
				if( min!=undefined) if( grade[x][y] < min ) grade[x][y] = min;
				if( max!=undefined) if( grade[x][y] < max ) grade[x][y] = max;
			}
			else grade[x][y] = -Infinity;
		}
	}
	
	
/*
	// Dump
	var dump = '<div class="row"><div class="small-12 large-12 columns"><table id="dumptable">';
	for( x=0; x<nx; x++ ) {
		dump += "<tr>";
		for( y=0; y<ny; y++ )
			dump += "<td>"+(Math.round(grade[x][ny-y]*100)/100)+"</td>";
		dump += "</tr>";
	}
	dump += "</table></div></div>";
	$("body").append( dump ); 
	$('#dumptable').css( "font-size:small" );
*/	
	
	var grade2 = new Array();
	grade2[0]=new Array();
	vmin = Infinity;
	vmax = -Infinity;
	for( x=1; x<nx+1; x++ ) {
		grade2[x] = new Array(ny+2);
		grade2[x][0] = 0;
		for( y=1; y<ny+1; y++ ) {
			if(grade[x-1][y-1] != -Infinity ) {
				grade2[x][y] = grade[x-1][y-1]; 
				if( grade2[x][y] < vmin ) vmin=grade2[x][y];
				if( grade2[x][y] > vmax ) vmax=grade2[x][y];
			} else grade2[x][y] = -1;
		}
		grade2[x][ny+1]=0;
	}
	grade2[nx+1]=new Array();
	for( y=0; y<ny+2; y++ )
		grade2[nx+1][y]=0;
	for(x=0;x<nx+2;x++){
		grade2[x][0] = vmin-2;
		grade2[x][ny+1] = vmin-2;
	}
	for(y=0;y<ny+2;y++){
		grade2[0][y] = vmin-2;
		grade2[nx+1][y] = vmin-2;
	}

	for( x=1; x<nx+1; x++ )
		for( y=1; y<ny+1; y++ )
			if( grade[x-1][y-1]==-Infinity )
				grade2[x][y] = vmin-2;

	// Calcula as curvas de nível
	var c = new Conrec();
	var vx = new Array();
	for( i=0; i<nx+2; i++ )
		vx.push(i); 
	var vy = new Array();
	for( i=0; i<ny+2; i++ )
		vy.push(i); 
	
	// Determina os valores convertidos das camadas
	var classes = this.parametros.mapa.classes;
	
	var camadas = new Array();
	camadas[0] = vmin-1;
	for( i=1; i<classes.length-1; i++ )
		camadas[i] = classes[i]; 

	c.contour(grade2, 0, nx+1, 0, ny+1, vx, vy, camadas.length, camadas);
	var curvas = c.contourList();
	
	// A posição inicial do contorno no vetor será usada como código, pois o vetor poderá
	// ser reordenado.
	var contornos = new Object();
	for( i=0; i<curvas.length; i++ ) {
		contornos[i] = new Object();
		contornos[i].camada = parseInt(curvas[i].k);
		contornos[i].valor  = curvas[i].level;
		contornos[i].pontos = new Array();
		contornos[i].pontos[0] = {
					x: curvas[i][0].x, 
					y: curvas[i][0].y  
				};
		for( j=1, k=1; j<curvas[i].length; j++ ) 
			contornos[i].pontos[k++] = {
						x: curvas[i][j].x, 
						y: curvas[i][j].y 
					};
		contornos[i].contidoEm = new Array();
	}
	
	
	// Ajusta os polígonos, para que um 'buraco' seja representado por uma curva de nível
	// da camada inferior. Isso é feito verificando se um polígono inserido em outro 
	// também está na mesma camada deste. A rotina inicia considerando que o vetor já
	// foi construído de forma ordenada. O polígono 0 representa a região de fundo e não
	// deve ser considerado.

	// Passo 1 - construir um polígono no sentido inverso para cada contorno (o Google Maps cria buracos por meio de polígonos que "giram" na direção inversa)
	var polis = new Object();
	var gmPolis = new Array();
	for( i in contornos ) {
		polis[i] = new Array();
		gmPolis[i] = new Array();
		for( j=contornos[i].pontos.length-1; j>=0; j-- ) {
			polis[i].push( [contornos[i].pontos[j].x,contornos[i].pontos[j].y ] );
			gmPolis[i].push( new google.maps.LatLng(contornos[i].pontos[j].y*passoy+this.parametros.mapa.limites.sul,contornos[i].pontos[j].x*passox+this.parametros.mapa.limites.oeste));
		}
	}

	// Passo 2 - verificar se os polígonos estão estão contidos em outros, por meio de um único ponto, já que não pode haver cruzamento de linhas de nível.	
	for( i in contornos )
		for( j in contornos ) {
			if( i!=0 && j!=0 && i!=j )
				if( pip( polis[j], polis[i][0][0], polis[i][0][1] ) )
					contornos[i].contidoEm.push( j );
		}
	
	// Passo 3 - Verificar se um polígono contido em outro pertence à mesma camada. 
	// Caso afirmativo, esse polígono é apenas um buraco no maior 
	var pBuracos = new Array();
	for( i in contornos )
		for( j in contornos )
			if( i!=0 && j!=0 && i!=j )
				if( contornos[j].camada == contornos[i].camada )
					if( contornos[i].contidoEm.indexOf( j ) != -1 )
						pBuracos.push( [i,j] );
		
		
	// Primeiro polígono é substituído pela região delimitada, pois serve apenas para marcar a bounding box
	var poligonos = new Array();
	var k=0;
	var continua;
	var codToNum = new Object();	// Mapeamento do código em um índice para encaixar os buracos
	var corNum = new Array();		// referência da camada para seleçao da cor
	corNum[0] = 0;
	for( i in contornos ) {
		continua=true;
		for( b=0; b<pBuracos.length; b++ )		// Testa se não é apenas um buraco de outro polígono
			if( i==pBuracos[b][0] )
				continua=false;
		if(!continua)
			continue;	
		codToNum[i] = k;						
		corNum[k] = contornos[i].camada;
		poligonos[k] = new Array();
		for( j=0; j<contornos[i].pontos.length; j++ )
			poligonos[k].push( new google.maps.LatLng(
								contornos[i].pontos[j].y*passoy+this.parametros.mapa.limites.sul,
								contornos[i].pontos[j].x*passox+this.parametros.mapa.limites.oeste
						));
		k++;
	}
	
	// Cria o vetor de listas de polígonos (principal e buracos)
	var mPoligonos = new Array();
	for( i=0; i<poligonos.length; i++ )
		mPoligonos[i] = [ poligonos[i] ];

	// Inclui os buracos
	for(b=0; b<pBuracos.length; b++) {
		i = pBuracos[b][0];
		j = pBuracos[b][1];
		mPoligonos[codToNum[j]].push( gmPolis[i] );
	}

	var cores = __gpmAutoRef.cores[this.parametros.mapa['qtdeClasses']-1][this.parametros.mapa['esquemaDeCores']];
	for( i in mPoligonos ) {
		var polygon =  new google.maps.Polygon({
				paths: mPoligonos[i],
				strokeWeight: 0,
				fillColor: cores[corNum[i]],
				fillOpacity: 1,
				zIndex: 2
			});
		polygon.setMap( this.parametros.mapa['mapa'] );
		this.poligonos.push( polygon );
	}

	// Altera a opacidade do mapa coroplético
	this.parametros.mapa.opacidade = 0;
	__gpmAutoRef.alteraMapa();

	// Marca os pontos no mapa
	for( i in this.parametros.coordenadas ) {
		circulo = new google.maps.Circle( {
			fillColor: '#000000',
			fillOpacity: 1,
			map: this.parametros.mapa['mapa'],
			center: new google.maps.LatLng( this.parametros.coordenadas[i][1],this.parametros.coordenadas[i][0] ),
			radius: 2,
			zIndex: 20
		} );
		this.poligonos.push( circulo );
	}
}

GeoPUCMinas.prototype.kriging.prototype.removeInterpolacao = function() {

	// Remove os polígonos (e circulos);
	for( i in this.poligonos ) 
		this.poligonos[i].setMap( null );
	this.poligonos = new Array();


	// Altera a opacidade do mapa coroplético
	this.parametros.mapa.opacidade = 1;
	__gpmAutoRef.alteraMapa();
	this.parametros = new Object();
	this.poligonos = null;
	this.dadosMapa = null;
	this.poligonosCoropletico = null;
	this.X_inv = null;
}
		

// ---------------------------------------------------------------------------------------
// FUNÇÕES AUXILIARES PARA CÁLCULOS MATRICIAIS
// Criado por Omar E. Olmedo (https://github.com/oeo4b/kriging.js)
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.kriging.prototype.max = function (a) {
    return Math.max.apply(null, a)
}

GeoPUCMinas.prototype.kriging.prototype.min = function (a) {
    return Math.min.apply(null, a)
}

GeoPUCMinas.prototype.kriging.prototype.mean = function (a) {
    for (var i = 0, sum = 0; i < a.length; i++)
        sum += a[i];
    return sum / a.length;
}


// ---------------------------------------------------------------------------------------
// FUNÇÕES AUXILIARES PARA CÁLCULOS MATRICIAIS
// Criado por Omar E. Olmedo (https://github.com/oeo4b/kriging.js)
// ---------------------------------------------------------------------------------------
/* Point-in-polygon */
var pip = function (poligono, x, y) {
    var i, j;
    var c = false;
    for (i=0, j=poligono.length-1; i<poligono.length; j=i++) {
        if (((poligono[i][1] > y) != (poligono[j][1] > y)) && (x < (poligono[j][0] - poligono[i][0]) * (y - poligono[i][1]) / (poligono[j][1] - poligono[i][1]) + poligono[i][0])) {
            c = !c;
        }
    }
    return c;
}


/**
 * Ported R functions
 */
/* Repeat a value */
var R_rep = function (x, times) {
    var i = new Array(times);
    for (var j = 0; j < i.length; j++) {
        i[j] = x;
    }
    return i;
}

/* Matrix transpose */
var R_t = function (x) {
    /* Must be a 2-dimensional matrix */
    var i, j, n, m;
    n = x.length;
    m = x[0].length;

    var y = new Array(m);
    for (i = 0; i < m; i++) {
        y[i] = new Array(n);
        for (j = 0; j < n; j++) {
            y[i][j] = x[j][i];
        }
    }
    return y;
}


/* Determinant */
var R_det = function (x, n) {
    var i, j, k, l;
    var det = 0;
    var m = new Array(n - 1);
    for (i = 0; i < (n - 1); i++) {
        m[i] = new Array(n - 1);
    }

    if (n < 1) return;
    else {
        if (n == 1) det = x[0][0];
        else {
            if (n == 2) det = x[0][0] * x[1][1] - x[1][0] * x[0][1];
            else {
                det = 0;
                for (i = 0; i < n; i++) {
                    for (j = 1; j < n; j++) {
                        k = 0;
                        for (l = 0; l < n; l++) {
                            if (l == i) continue;
                            m[j - 1][k] = x[j][l];
                            k++;
                        }
                    }
                    det += Math.pow(-1, i + 2) * x[0][i] * R_det(m, n - 1);
                }
            }
        }
        return det;
    }
}

/* Non-R function -- essential for R_solve_ */
var cofactor = function (x, n) {
    var i, j, k, l, m, o;
    var det;
    var c = new Array(n - 1);
    var y = new Array(n);

    for (i = 0; i < n; i++) y[i] = new Array(n);
    for (i = 0; i < (n - 1); i++) c[i] = new Array(n - 1);
    for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
            k = 0;
            for (l = 0; l < n; l++) {
                if (l == j) continue;
                m = 0;
                for (o = 0; o < n; o++) {
                    if (o == i) continue;
                    c[k][m] = x[l][o];
                    m++;
                }
                k++;
            }
            det = R_det(c, n - 1);
            y[j][i] = Math.pow(-1, j + i + 2) * det;
        }
    }
    return y;
}

/* Matrix inversion -- Gauss-jordan elimination */
var R_solve = function (a) {
    var n = a.length;
    var m = n;
    var b = new Array(n);
    var indxc = new Array(n);
    var indxr = new Array(n);
    var ipiv = new Array(n);

    var i, icol, irow, j, k, l, ll;
    var big, dum, pivinv, temp;

    for (i = 0; i < n; i++) {
        b[i] = new Array(n);
        for (j = 0; j < n; j++) {
            if (i == j) b[i][j] = 1;
            else b[i][j] = 0;
        }
    }
    for (j = 0; j < n; j++) ipiv[j] = 0;
    for (i = 0; i < n; i++) {
        big = 0;
        for (j = 0; j < n; j++) {
            if (ipiv[j] != 1) {
                for (k = 0; k < n; k++) {
                    if (ipiv[k] == 0) {
                        if (Math.abs(a[j][k]) >= big) {
                            big = Math.abs(a[j][k]);
                            irow = j;
                            icol = k;
                        }
                    }
                }
            }
        }
        ++(ipiv[icol]);

        if (irow != icol) {
            for (l = 0; l < n; l++) {
                temp = a[irow][l];
                a[irow][l] = a[icol][l];
                a[icol][l] = temp;
            }
            for (l = 0; l < m; l++) {
                temp = b[irow][l];
                b[irow][l] = b[icol][l];
                b[icol][l] = temp;
            }
        }

        indxr[i] = irow;
        indxc[i] = icol;

        if (a[icol][icol] == 0) { /* Singular matrix */
            return false;
        }

        pivinv = 1 / a[icol][icol];
        a[icol][icol] = 1;
        for (l = 0; l < n; l++) a[icol][l] *= pivinv;
        for (l = 0; l < m; l++) b[icol][l] *= pivinv;

        for (ll = 0; ll < n; ll++) {
            if (ll != icol) {
                dum = a[ll][icol];
                a[ll][icol] = 0;
                for (l = 0; l < n; l++) a[ll][l] -= a[icol][l] * dum;
                for (l = 0; l < m; l++) b[ll][l] -= b[icol][l] * dum;
            }
        }
    }

    for (l = (n - 1); l >= 0; l--) {
        if (indxr[l] != indxc[l]) {
            for (k = 0; k < n; k++) {
                temp = a[k][indxr[l]];
                a[k][indxr[l]] = a[k][indxc[l]];
                a[k][indxc[l]] = temp;
            }
        }
    }

    return a;
}

var R_solve_cramers_rule = function (x) {
    /* Solve to determine the adjunct matrix */
    var i, j;
    var adj = R_t(cofactor(x, x.length));
    var inv_det_a = 1 / R_det(x, x.length);
    var y = new Array(x.length);

    for (i = 0; i < x.length; i++) {
        y[i] = new Array(x.length);
        for (j = 0; j < x.length; j++) {
            y[i][j] = inv_det_a * adj[i][j];
        }
    }

    return y;
}

/* Fit a linear model */
var R_lm = function (y, x) {
    var n = y.length;

    /* Add an intercept term to the design matrix */
    x = [R_rep(1, n), x];
    y = [y];

    /* OLS estimate */
    return matrixmult(matrixmult(R_solve(matrixmult(R_t(x), x)), R_t(x)), y);
}

/* Cluster analysis */
var R_kmeans = function (x, y, centers) {

}

/**
 * Matrix multiplication
 */
var matrixmult = function (y, x) {
    var i, j, k;
    var n = x.length;
    var m = x[0].length;
    if (m != y.length) return false;
    var p = y[0].length;
    var z = new Array(n);

    for (i = 0; i < n; i++) {
        z[i] = new Array(p);
        for (j = 0; j < p; j++) {
            z[i][j] = 0;
            for (k = 0; k < m; k++) {
                z[i][j] += x[i][k] * y[k][j];
            }
        }
    }
    return z;
}





/*
 * Copyright (c) 1996-1997 Nicholas Yue
 *
 * This software is copyrighted by Nicholas Yue. This code is based on Paul D.
 * Bourke's CONREC.F routine.
 *
 * The authors hereby grant permission to use, copy, and distribute this
 * software and its documentation for any purpose, provided that existing
 * copyright notices are retained in all copies and that this notice is
 * included verbatim in any distributions. Additionally, the authors grant
 * permission to modify this software and its documentation for any purpose,
 * provided that such modifications are not distributed without the explicit
 * consent of the authors and that existing copyright notices are retained in
 * all copies. Some of the algorithms implemented by this software are
 * patented, observe all applicable patent law.
 *
 * IN NO EVENT SHALL THE AUTHORS OR DISTRIBUTORS BE LIABLE TO ANY PARTY FOR
 * DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT
 * OF THE USE OF THIS SOFTWARE, ITS DOCUMENTATION, OR ANY DERIVATIVES THEREOF,
 * EVEN IF THE AUTHORS HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * THE AUTHORS AND DISTRIBUTORS SPECIFICALLY DISCLAIM ANY WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.  THIS SOFTWARE IS
 * PROVIDED ON AN "AS IS" BASIS, AND THE AUTHORS AND DISTRIBUTORS HAVE NO
 * OBLIGATION TO PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR
 * MODIFICATIONS.
 */


  var EPSILON = Number.MIN_VALUE;

  function pointsEqual(a, b) {
    var x = a.x - b.x, y = a.y - b.y;
    return x * x + y * y < EPSILON;
  }

  function reverseList(list) {
    var pp = list.head;

    while (pp) {
      // swap prev/next pointers
      var temp = pp.next;
      pp.next = pp.prev;
      pp.prev = temp;

      // continue through the list
      pp = temp;
    }

    // swap head/tail pointers
    var temp = list.head;
    list.head = list.tail;
    list.tail = temp;
  }

  function ContourBuilder(level) {
    this.level = level;
    this.s = null;
    this.count = 0;
  }
  ContourBuilder.prototype.remove_seq = function(list) {
    // if list is the first item, static ptr s is updated
    if (list.prev) {
      list.prev.next = list.next;
    } else {
      this.s = list.next;
    }

    if (list.next) {
      list.next.prev = list.prev;
    }
    --this.count;
  }
  ContourBuilder.prototype.addSegment = function(a, b) {
    var ss = this.s;
    var ma = null;
    var mb = null;
    var prependA = false;
    var prependB = false;

    while (ss) {
      if (ma == null) {
        // no match for a yet
        if (pointsEqual(a, ss.head.p)) {
          ma = ss;
          prependA = true;
        } else if (pointsEqual(a, ss.tail.p)) {
          ma = ss;
        }
      }
      if (mb == null) {
        // no match for b yet
        if (pointsEqual(b, ss.head.p)) {
          mb = ss;
          prependB = true;
        } else if (pointsEqual(b, ss.tail.p)) {
          mb = ss;
        }
      }
      // if we matched both no need to continue searching
      if (mb != null && ma != null) {
        break;
      } else {
        ss = ss.next;
      }
    }

    // c is the case selector based on which of ma and/or mb are set
    var c = ((ma != null) ? 1 : 0) | ((mb != null) ? 2 : 0);

    switch(c) {
      case 0:   // both unmatched, add as new sequence
        var aa = {p: a, prev: null};
        var bb = {p: b, next: null};
        aa.next = bb;
        bb.prev = aa;

        // create sequence element and push onto head of main list. The order
        // of items in this list is unimportant
        ma = {head: aa, tail: bb, next: this.s, prev: null, closed: false};
        if (this.s) {
          this.s.prev = ma;
        }
        this.s = ma;

        ++this.count;    // not essential - tracks number of unmerged sequences
      break;

      case 1:   // a matched, b did not - thus b extends sequence ma
        var pp = {p: b};

        if (prependA) {
          pp.next = ma.head;
          pp.prev = null;
          ma.head.prev = pp;
          ma.head = pp;
        } else {
          pp.next = null;
          pp.prev = ma.tail;
          ma.tail.next = pp;
          ma.tail = pp;
        }
      break;

      case 2:   // b matched, a did not - thus a extends sequence mb
        var pp = {p: a};

        if (prependB) {
          pp.next = mb.head;
          pp.prev = null;
          mb.head.prev = pp;
          mb.head = pp;
        } else {
          pp.next = null;
          pp.prev = mb.tail;
          mb.tail.next = pp;
          mb.tail = pp;
        }
      break;

      case 3:   // both matched, can merge sequences
        // if the sequences are the same, do nothing, as we are simply closing this path (could set a flag)

        if (ma === mb) {
          var pp = {p: ma.tail.p, next: ma.head, prev: null};
          ma.head.prev = pp;
          ma.head = pp;
          ma.closed = true;
          break;
        }

        // there are 4 ways the sequence pair can be joined. The current setting of prependA and
        // prependB will tell us which type of join is needed. For head/head and tail/tail joins
        // one sequence needs to be reversed
        switch((prependA ? 1 : 0) | (prependB ? 2 : 0)) {
          case 0:   // tail-tail
            // reverse ma and append to mb
            reverseList(ma);
            // fall through to head/tail case
          case 1:   // head-tail
            // ma is appended to mb and ma discarded
            mb.tail.next = ma.head;
            ma.head.prev = mb.tail;
            mb.tail = ma.tail;

            //discard ma sequence record
            this.remove_seq(ma);
          break;

          case 3:   // head-head
            // reverse ma and append mb to it
            reverseList(ma);
            // fall through to tail/head case
          case 2:   // tail-head
            // mb is appended to ma and mb is discarded
            ma.tail.next = mb.head;
            mb.head.prev = ma.tail;
            ma.tail = mb.tail;

            //discard mb sequence record
            this.remove_seq(mb);
        break;
      }
    }
  }

  /**
   * Implements CONREC.
   *
   * @param {function} drawContour function for drawing contour.  Defaults to a
   *                               custom "contour builder", which populates the
   *                               contours property.
   */
  function Conrec(drawContour) {
    if (!drawContour) {
      var c = this;
      c.contours = {};
      /**
       * drawContour - interface for implementing the user supplied method to
       * render the countours.
       *
       * Draws a line between the start and end coordinates.
       *
       * @param startX    - start coordinate for X
       * @param startY    - start coordinate for Y
       * @param endX      - end coordinate for X
       * @param endY      - end coordinate for Y
       * @param contourLevel - Contour level for line.
       */
      this.drawContour = function(startX, startY, endX, endY, contourLevel, k) {
        var cb = c.contours[k];
        if (!cb) {
          cb = c.contours[k] = new ContourBuilder(contourLevel);
        }
        cb.addSegment({x: startX, y: startY}, {x: endX, y: endY});
      }
      this.contourList = function() {
        var l = [];
        var a = c.contours;
        for (var k in a) {
          var s = a[k].s;
          var level = a[k].level;
          while (s) {
            var h = s.head;
            var l2 = [];
            l2.level = level;
            l2.k = k;
            while (h && h.p) {
              l2.push(h.p);
              h = h.next;
            }
            l.push(l2);
            s = s.next;
          }
        }
        l.sort(function(a, b) { return a.k - b.k });
        return l;
      }
    } else {
      this.drawContour = drawContour;
    }
    this.h  = new Array(5);
    this.sh = new Array(5);
    this.xh = new Array(5);
    this.yh = new Array(5);
  }

  /**
   * contour is a contouring subroutine for rectangularily spaced data
   *
   * It emits calls to a line drawing subroutine supplied by the user which
   * draws a contour map corresponding to real*4data on a randomly spaced
   * rectangular grid. The coordinates emitted are in the same units given in
   * the x() and y() arrays.
   *
   * Any number of contour levels may be specified but they must be in order of
   * increasing value.
   *
   *
   * @param {number[][]} d - matrix of data to contour
   * @param {number} ilb,iub,jlb,jub - index bounds of data matrix
   *
   *             The following two, one dimensional arrays (x and y) contain
   *             the horizontal and vertical coordinates of each sample points.
   * @param {number[]} x  - data matrix column coordinates
   * @param {number[]} y  - data matrix row coordinates
   * @param {number} nc   - number of contour levels
   * @param {number[]} z  - contour levels in increasing order.
   */
  Conrec.prototype.contour = function(d, ilb, iub, jlb, jub, x, y, nc, z) {
    var h = this.h, sh = this.sh, xh = this.xh, yh = this.yh;
    var drawContour = this.drawContour;
    this.contours = {};

    /** private */
    var xsect = function(p1, p2){
      return (h[p2]*xh[p1]-h[p1]*xh[p2])/(h[p2]-h[p1]);
    }

    var ysect = function(p1, p2){
      return (h[p2]*yh[p1]-h[p1]*yh[p2])/(h[p2]-h[p1]);
    }
    var m1;
    var m2;
    var m3;
    var case_value;
    var dmin;
    var dmax;
    var x1 = 0.0;
    var x2 = 0.0;
    var y1 = 0.0;
    var y2 = 0.0;

    // The indexing of im and jm should be noted as it has to start from zero
    // unlike the fortran counter part
    var im = [0, 1, 1, 0];
    var jm = [0, 0, 1, 1];

    // Note that castab is arranged differently from the FORTRAN code because
    // Fortran and C/C++ arrays are transposed of each other, in this case
    // it is more tricky as castab is in 3 dimensions
    var castab = [
      [
        [0, 0, 8], [0, 2, 5], [7, 6, 9]
      ],
      [
        [0, 3, 4], [1, 3, 1], [4, 3, 0]
      ],
      [
        [9, 6, 7], [5, 2, 0], [8, 0, 0]
      ]
    ];

    for (var j=(jub-1);j>=jlb;j--) {
      for (var i=ilb;i<=iub-1;i++) {
        var temp1, temp2;
        temp1 = Math.min(d[i][j],d[i][j+1]);
        temp2 = Math.min(d[i+1][j],d[i+1][j+1]);
        dmin  = Math.min(temp1,temp2);
        temp1 = Math.max(d[i][j],d[i][j+1]);
        temp2 = Math.max(d[i+1][j],d[i+1][j+1]);
        dmax  = Math.max(temp1,temp2);

        if (dmax>=z[0]&&dmin<=z[nc-1]) {
          for (var k=0;k<nc;k++) {
            if (z[k]>=dmin&&z[k]<=dmax) {
              for (var m=4;m>=0;m--) {
                if (m>0) {
                  // The indexing of im and jm should be noted as it has to
                  // start from zero
                  h[m] = d[i+im[m-1]][j+jm[m-1]]-z[k];
                  xh[m] = x[i+im[m-1]];
                  yh[m] = y[j+jm[m-1]];
                } else {
                  h[0] = 0.25*(h[1]+h[2]+h[3]+h[4]);
                  xh[0]=0.5*(x[i]+x[i+1]);
                  yh[0]=0.5*(y[j]+y[j+1]);
                }
                if (h[m]>0.0) {
                  sh[m] = 1;
                } else if (h[m]<0.0) {
                  sh[m] = -1;
                } else
                  sh[m] = 0;
              }
              //
              // Note: at this stage the relative heights of the corners and the
              // centre are in the h array, and the corresponding coordinates are
              // in the xh and yh arrays. The centre of the box is indexed by 0
              // and the 4 corners by 1 to 4 as shown below.
              // Each triangle is then indexed by the parameter m, and the 3
              // vertices of each triangle are indexed by parameters m1,m2,and
              // m3.
              // It is assumed that the centre of the box is always vertex 2
              // though this isimportant only when all 3 vertices lie exactly on
              // the same contour level, in which case only the side of the box
              // is drawn.
              //
              //
              //      vertex 4 +-------------------+ vertex 3
              //               | \               / |
              //               |   \    m-3    /   |
              //               |     \       /     |
              //               |       \   /       |
              //               |  m=2    X   m=2   |       the centre is vertex 0
              //               |       /   \       |
              //               |     /       \     |
              //               |   /    m=1    \   |
              //               | /               \ |
              //      vertex 1 +-------------------+ vertex 2
              //
              //
              //
              //               Scan each triangle in the box
              //
              for (m=1;m<=4;m++) {
                m1 = m;
                m2 = 0;
                if (m!=4) {
                    m3 = m+1;
                } else {
                    m3 = 1;
                }
                case_value = castab[sh[m1]+1][sh[m2]+1][sh[m3]+1];
                if (case_value!=0) {
                  switch (case_value) {
                    case 1: // Line between vertices 1 and 2
                      x1=xh[m1];
                      y1=yh[m1];
                      x2=xh[m2];
                      y2=yh[m2];
                      break;
                    case 2: // Line between vertices 2 and 3
                      x1=xh[m2];
                      y1=yh[m2];
                      x2=xh[m3];
                      y2=yh[m3];
                      break;
                    case 3: // Line between vertices 3 and 1
                      x1=xh[m3];
                      y1=yh[m3];
                      x2=xh[m1];
                      y2=yh[m1];
                      break;
                    case 4: // Line between vertex 1 and side 2-3
                      x1=xh[m1];
                      y1=yh[m1];
                      x2=xsect(m2,m3);
                      y2=ysect(m2,m3);
                      break;
                    case 5: // Line between vertex 2 and side 3-1
                      x1=xh[m2];
                      y1=yh[m2];
                      x2=xsect(m3,m1);
                      y2=ysect(m3,m1);
                      break;
                    case 6: //  Line between vertex 3 and side 1-2
                      x1=xh[m3];
                      y1=yh[m3];
                      x2=xsect(m1,m2);
                      y2=ysect(m1,m2);
                      break;
                    case 7: // Line between sides 1-2 and 2-3
                      x1=xsect(m1,m2);
                      y1=ysect(m1,m2);
                      x2=xsect(m2,m3);
                      y2=ysect(m2,m3);
                      break;
                    case 8: // Line between sides 2-3 and 3-1
                      x1=xsect(m2,m3);
                      y1=ysect(m2,m3);
                      x2=xsect(m3,m1);
                      y2=ysect(m3,m1);
                      break;
                    case 9: // Line between sides 3-1 and 1-2
                      x1=xsect(m3,m1);
                      y1=ysect(m3,m1);
                      x2=xsect(m1,m2);
                      y2=ysect(m1,m2);
                      break;
                    default:
                      break;
                  }
                  // Put your processing code here and comment out the printf
                  //printf("%f %f %f %f %f\n",x1,y1,x2,y2,z[k]);
                  drawContour(x1,y1,x2,y2,z[k],k);
                }
              }
            }
          }
        }
      }
    }
  }
