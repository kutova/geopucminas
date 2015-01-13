// ---------------------------------------------------------------------------------------
// GeoPUCMinas.js
//
// Biblioteca JavaScript para desenho de mapas coropléticos e isopléticos 
// usando a API do Google Maps
//
// Autor: Marcos André Silveira Kutova (kutova@pucminas.br)
// URL: http://lab.kutova.com/geopucminas
//
// As rotinas desta biblioteca foram construídas durante o doutoramento do autor no 
// Programa de Pós-graduação em Geografia - Tratamento da Informação Espacial da 
// Pontifícia Universidade Católica de Minas Gerais,
// sob orientação do Prof. Dr. João Francisco de Abreu
// (http://www.pucminas.br/pos/geografia/)
//
// Direitos reservados: Marcos André Silveira Kutova, 2013-2014.
// Disponível por meio da licença Creative Commons Atribuição-CompartilhadaIgual 3.0 Não Adaptada
// (http://creativecommons.org/licenses/by-sa/3.0/)
//
// ROTINAS:
// 	    adicionaMapa()      Adiciona um novo mapa coroplético à coleção de mapas
//	    alteraDados()       Muda o conjunto de dados usado na construção do mapa
//	    alteraEscala()      Altera o filtro de região, provocando uma mudança de escala
//
//
//
// ROTINAS DE TERCEIROS:
//
//
//
// DEPENDÊNCIAS:
// Google Maps (https://developers.google.com/maps/)
// jQuery (http://jquery.com/)
//
//
// Tarefas pendentes: 
// - criar as classes CSS para formatação das janelas modais (variáveis, opções e tabela)
// - receber dados dos municípios por meio de uma lista CSV, que possa ser exportada do Excel
// - criar função para determinar o centróide de um polígono
// - modularizar as rotinas de aplicação de filtros e de desenho de polígonos (duplicadas nas funções adicionaMapa() e alteraEscala() )
// - criar uma rotina que permita a determinação externa das classes (algo como alteraClasses() )
// - colocar as cores da legenda no arquivo geopucminas.css
// - Alterar a forma de acesso aos botões do mapa, para que sejam feitas por meio dos seguintes atributos:
//	    data-geopucminas  => define a funcionalidade do botão ('opções', 'tabela', 'variável', ...)
//      data-mapa         => define o número do mapa ao qual o botão está associado
// - O atributo data-mapa, ao invés de conter um número, deve conter o identificador do mapa
// - Usar a fórmula de Sturges  quando não for especificada a quantidade de classes
// - Assegurar que a lista de dados não precisa estar ordenada nem completa. Verificar se alguma rotina depende dessa ordenação.
// - A ausência da informação de um município deveria representar a ausência do polígono correspondente no mapa.
// - Trocar o termo na configuração inicial:  opacidade => transparência
// - Colocar a configuração do exibição do controle pan/zoom nas opções da função adicionaMapa
// - Mapas isopléticos - contornos ainda estão serrilhados
// - Colocar o símbolo de norte configurável
// - Quando apresentar o mapa de fundo do Google Maps, retirar o controle de escala personalizado e inserir o controle de escala padrão do Google
// - Trocar o componente do Google Visualization por outro que não abrevie os rótulos (http://www.chartjs.org/  ou  http://webdesignledger.com/resources/13-useful-javascript-solutions-for-charts-and-graphs)
// - Permitir a inversão do sinal da componente principal
// - INIT_BOUNDS: Testar se a determinação dos limites do mapa não pode ser feita com os polígonos de escalas superiores, como as do estado, da mesorregião ou da microrregião.
// - Link ou dados do município (na InfoWindow) devem ser gerenciados externamente (fora deste arquivo JS). Se nada for definido, o nome do município não deve ser um link.
// - Ao exibir o mapa do fundo, o controle de escala deve ser o do próprio Google Maps
//
// Última atualização em 24/abril/2014
// ---------------------------------------------------------------------------------------

var __gpmAutoRef = null;  // variável usada para manter uma referência externa à biblioteca

// ---------------------------------------------------------------------------------------
// Classe GeoPUCMinas
// ---------------------------------------------------------------------------------------
function GeoPUCMinas(uf) {

    __gpmAutoRef = this;

	// Geometria do mapa
	this.uf = uf;										// Nome da Unidade Federativa
	this.dadosMunicipios = geometriaMunicipios[uf];		// dados e geometrias dos municípios
	this.dadosMicros = geometriaMicros[uf];				// dados e geometrias das microrregiões
	this.dadosMesos = geometriaMesos[uf];				// dados e geometrias das mesorregiões
	this.rótulosMunicípios = [ 'Nome Município',		// 0    rótulos do vetor de municípios
							   'Código Micro',			// 1 
							   'Código Meso',			// 2
							   'Área',					// 3
							   'Long',					// 4
							   'Lat',					// 5
							   'Geometria' ];			// 6
	this.rótulosMesos = 	 [ 'Nome Meso',				// 0    rótulos do vetor de microrregiões
						 	   'Geometria' ];			// 1
	this.rótulosMicros = 	 [ 'Nome Micro',			// 0	rótulos do vetor de mesorregiões
						  	   'Código Meso', 			// 1
						  	   'Geometria' ];			// 2
	// Atributos dos mapas
	this.coleçãoMapas = [];     // Vetor que contém os dados dos mapas nas páginas
	this.mapaSelecionado = 0;	// Mapa selecionado
	this.dica = [];				// Nome de cada município
	this.infoWindow = null;		// Janela de diálogo que é apresentada ao se clicar no município

	// Tabelas de dados
	this.dadosTabela = null;	// Vetor com os dados a serem exibidos na tabela 
	this.ordemTabela = -1;		// Ordem da tabela de dados do mapa selecionado

	// Mapa isoplético (se criado)
	this.isopletico = null;

	// Atributos globais da biblioteca
	this.intervalID = null;		// Controlador da atualização temporizada do mapa
	var confirmar = null;       // Auxiliar para indicar se as alterações nas janelas modais estão sendo confirmadas ou canceladas
	this.estados = { 'MG': 'Minas Gerais' };
	this.cores = [ 				// Esquemas de cores para os mapas (Fonte: ColorBrewer.org)
					{ // 1 cor - não especificado no ColorBrewer
						'Vermelho': [ 'rgb(222,45,38)' ],
						'Azul': [ 'rgb(49,130,189)' ],
						'Verde': [ 'rgb(49,163,84)' ],
						'Espectral': [ 'rgb(153,213,148)' ],
						'VermelhoAzul': [ 'rgb(239,138,98)' ]
					},
					{ // 2 cores - não especificado no ColorBrewer
						'Vermelho': [ 'rgb(254,224,210)', 'rgb(222,45,38)' ],
						'Azul': [ 'rgb(222,235,247)', 'rgb(49,130,189)' ],
						'Verde': [ 'rgb(229,245,224)', 'rgb(49,163,84)' ],
						'Espectral': [ 'rgb(252,141,89)', 'rgb(153,213,148)' ],
						'VermelhoAzul': [ 'rgb(239,138,98)', 'rgb(103,169,207)' ]
					},
					{  // 3 cores
						'Vermelho': [ 'rgb(254,224,210)', 'rgb(252,146,114)', 'rgb(222,45,38)' ],
						'Azul': [ 'rgb(222,235,247)', 'rgb(158,202,225)', 'rgb(49,130,189)' ],
						'Verde': [ 'rgb(229,245,224)', 'rgb(161,217,155)', 'rgb(49,163,84)' ],
						'Espectral': [ 'rgb(252,141,89)', 'rgb(255,255,191)', 'rgb(153,213,148)' ],
						'VermelhoAzul': [ 'rgb(239,138,98)', 'rgb(247,247,247)', 'rgb(103,169,207)' ]
					},
					{  // 4 cores
						'Vermelho': [ 'rgb(254,229,217)', 'rgb(252,174,145)', 'rgb(251,106,74)', 'rgb(203,24,29)' ],
						'Azul': [ 'rgb(239,243,255)', 'rgb(189,215,231)', 'rgb(107,174,214)', 'rgb(33,113,181)' ],
						'Verde': [ 'rgb(237,248,233)', 'rgb(186,228,179)', 'rgb(116,196,118)', 'rgb(35,139,69)' ],
						'Espectral': [ 'rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(171,221,164)', 'rgb(43,131,186)' ],
						'VermelhoAzul': [ 'rgb(202,0,32)', 'rgb(244,165,130)', 'rgb(146,197,222)', 'rgb(5,113,176)' ]
					},
					{  // 5 cores
						'Vermelho': [ 'rgb(254,229,217)', 'rgb(252,174,145)', 'rgb(251,106,74)', 'rgb(222,45,38)', 'rgb(165,15,21)' ],
						'Azul': [ 'rgb(239,243,255)', 'rgb(189,215,231)', 'rgb(107,174,214)', 'rgb(49,130,189)', 'rgb(8,81,156)' ],
						'Verde': [ 'rgb(237,248,233)', 'rgb(186,228,179)', 'rgb(116,196,118)', 'rgb(49,163,84)', 'rgb(0,109,44)' ],
						'Espectral': [ 'rgb(215,25,28)', 'rgb(253,174,97)', 'rgb(255,255,191)', 'rgb(171,221,164)', 'rgb(43,131,186)' ],
						'VermelhoAzul': [ 'rgb(202,0,32)', 'rgb(244,165,130)', 'rgb(247,247,247)', 'rgb(146,197,222)', 'rgb(5,113,176)' ]
					},
					{  // 6 cores
						'Vermelho': [ 'rgb(254,229,217)', 'rgb(252,187,161)', 'rgb(252,146,114)', 'rgb(251,106,74)', 'rgb(222,45,38)', 'rgb(165,15,21)' ],
						'Azul': [ 'rgb(239,243,255)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(49,130,189)', 'rgb(8,81,156)' ],
						'Verde': [ 'rgb(237,248,233)', 'rgb(199,233,192)', 'rgb(161,217,155)', 'rgb(116,196,118)', 'rgb(49,163,84)', 'rgb(0,109,44)' ],
						'Espectral': [ 'rgb(213,62,79)', 'rgb(252,141,89)', 'rgb(254,224,139)', 'rgb(230,245,152)', 'rgb(153,213,148)', 'rgb(50,136,189)' ],
						'VermelhoAzul': [ 'rgb(178,24,43)', 'rgb(239,138,98)', 'rgb(253,219,199)', 'rgb(209,229,240)', 'rgb(103,169,207)', 'rgb(33,102,172)' ]
					},
					{  // 7 cores
						'Vermelho': [ 'rgb(254,229,217)', 'rgb(252,187,161)', 'rgb(252,146,114)', 'rgb(251,106,74)', 'rgb(239,59,44)', 'rgb(203,24,29)', 'rgb(153,0,13)' ],
						'Azul': [ 'rgb(239,243,255)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,69,148)' ],
						'Verde': [ 'rgb(237,248,233)', 'rgb(199,233,192)', 'rgb(161,217,155)', 'rgb(116,196,118)', 'rgb(65,171,93)', 'rgb(35,139,69)', 'rgb(0,90,50)' ],
						'Espectral': [ 'rgb(213,62,79)', 'rgb(252,141,89)', 'rgb(254,224,139)', 'rgb(255,255,191)', 'rgb(230,245,152)', 'rgb(153,213,148)', 'rgb(50,136,189)' ],
						'VermelhoAzul': [ 'rgb(178,24,43)', 'rgb(239,138,98)', 'rgb(253,219,199)', 'rgb(247,247,247)', 'rgb(209,229,240)', 'rgb(103,169,207)', 'rgb(33,102,172)' ]
					},
					{  // 8 cores
						'Vermelho': [ 'rgb(255,245,240)', 'rgb(254,224,210)', 'rgb(252,187,161)', 'rgb(252,146,114)', 'rgb(251,106,74)', 'rgb(239,59,44)', 'rgb(203,24,29)', 'rgb(153,0,13)' ],
						'Azul': [ 'rgb(247,251,255)', 'rgb(222,235,247)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,69,148)' ],
						'Verde': [ 'rgb(247,252,245)', 'rgb(229,245,224)', 'rgb(199,233,192)', 'rgb(161,217,155)', 'rgb(116,196,118)', 'rgb(65,171,93)', 'rgb(35,139,69)', 'rgb(0,90,50)' ],
						'Espectral': [ 'rgb(213,62,79)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,139)', 'rgb(230,245,152)', 'rgb(171,221,164)', 'rgb(102,194,165)', 'rgb(50,136,189)' ],
						'VermelhoAzul': [ 'rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(209,229,240)', 'rgb(146,197,222)', 'rgb(67,147,195)', 'rgb(33,102,172)' ]
					},
					{  // 9 cores
						'Vermelho': [ 'rgb(255,245,240)', 'rgb(254,224,210)', 'rgb(252,187,161)', 'rgb(252,146,114)', 'rgb(251,106,74)', 'rgb(239,59,44)', 'rgb(203,24,29)', 'rgb(165,15,21)', 'rgb(103,0,13)' ],
						'Azul': [ 'rgb(247,251,255)', 'rgb(222,235,247)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,81,156)', 'rgb(8,48,107)' ],
						'Verde': [ 'rgb(247,252,245)', 'rgb(229,245,224)', 'rgb(199,233,192)', 'rgb(161,217,155)', 'rgb(116,196,118)', 'rgb(65,171,93)', 'rgb(35,139,69)', 'rgb(0,109,44)', 'rgb(0,68,27)' ],
						'Espectral': [ 'rgb(213,62,79)', 'rgb(244,109,67)', 'rgb(253,174,97)', 'rgb(254,224,139)', 'rgb(255,255,191)', 'rgb(230,245,152)', 'rgb(171,221,164)', 'rgb(102,194,165)', 'rgb(50,136,189)' ],
						'VermelhoAzul': [ 'rgb(178,24,43)', 'rgb(214,96,77)', 'rgb(244,165,130)', 'rgb(253,219,199)', 'rgb(247,247,247)', 'rgb(209,229,240)', 'rgb(146,197,222)', 'rgb(67,147,195)', 'rgb(33,102,172)' ]
					} 
				];
	
	// Cria a janela de seleção de variáveis do mapa
	var janelaOpcoesVariaveis = document.createElement( 'div' );
	janelaOpcoesVariaveis.innerHTML = '<div id="gpmOpcoesVariavel"><div class="gpmJanelaModal"><h3>Seleção de variável</h3><form><p>Variável: <select name="gpmVariavelMapa" id="gpmVariavelMapa"></select></p></form><p style="text-align:right"><button class="small" id="gpmOpcoesVariavelBtOK">Confirmar</button><button class="small secondary" id="gpmOpcoesVariavelBtCancel">Cancelar</button></p></div></div>';
	document.body.appendChild( janelaOpcoesVariaveis );
	$('#gpmOpcoesVariavel').easyModal();
	
	// Cria a janela de configuração da apresentação do mapa
	var janelaOpcoesMapa = document.createElement( 'div' );
	janelaOpcoesMapa.innerHTML = '<div id="gpmOpcoesMapa"><div class="gpmJanelaModal"><h3> Configurações </h3><table><tr><td><form><fieldset><legend> Aparência </legend><p><input type="checkbox" name="gpmMapaFundo" id="gpmMapaFundo"/><label for="gpmMapaFundo"> Exibir mapa no fundo </label></p><p><input type="checkbox" name="gpmControlesMapa" id="gpmControlesMapa" CHECKED/><label for="gpmControlesMapa"> Exibir controles </label></p><p><label for="gpmTransparencia"> Transparência </label><input type="text" name="gpmTransparencia" id="gpmTransparencia" value="0" style="text-align:right"> % </p></fieldset></form><form><fieldset><legend> Limites </legend><p><label for="gpmMinimo"> Mínimo </label><input type="text" name="gpmMinimo" id="gpmMinimo" value="0" style="text-align:right"></p><p><label for="gpmMaximo"> Máximo </label><input type="text" name="gpmMaximo" id="gpmMaximo" value="0" style="text-align:right"></p></fieldset></form></td><td><form><fieldset><legend> Classes </legend><div class="row collapse "><p><label for="gpmMetodo"> Método </label><select name="gpmMetodo" id="gpmMetodo"><option value="quebras naturais" selected> Quebras naturais </option><option value="amplitude"> Intervalos iguais </option><option value="quantis"> Quantis </option><option value="manual"> Intervalos manuais </option></select></p><p><label for="gpmIntervalosManuais"> Intervalos </label><input type="text" name="gpmIntervalosManuais" id="gpmIntervalosManuais" disabled/></p><p><label for="gpmQtdeClasses"> Classes </label><select name="gpmQtdeClasses" id="gpmQtdeClasses"><option value="3"> 3 </option><option value="4"> 4 </option><option value="5" selected> 5 </option><option value="6"> 6 </option><option value="7"> 7 </option><option value="8"> 8 </option><option value="9"> 9 </option></select></p><p><label for="gpmEsquemaCores"> Cores </label><select name="gpmEsquemaCores" id="gpmEsquemaCores"><option selected> Vermelho </option><option> Azul </option><option> Verde </option><option> Espectral </option><option> VermelhoAzul </option></select></p><p><input type="checkbox" name="gpmInverterCores" id="gpmInverterCores"/><label for="gpmInverterCores"> Inverter esquema de cores </label></p></fieldset></form></td></tr></table><p style="text-align:right "><button id="gpmOpcoesMapaBtOk"> Confirmar </button><button id="gpmOpcoesMapaBtCancel"> Cancelar </button></p></div></div>';
	document.body.appendChild( janelaOpcoesMapa );
	$('#gpmOpcoesMapa').easyModal();
	
	// Cria a janela da tabela de dados do mapa
	var janelaTabelaDados = document.createElement( 'div' );
	janelaTabelaDados.innerHTML = '<div id="gpmTabelaMapa"><div class="gpmJanelaModal"><h3 style="margin-bottom:0"> Tabela de dados </h3><h5 style="margin-top:0"> Minas Gerais </h5><table><thead></thead><tfoot></tfoot><tbody></tbody></table><p style="text-align:right"><button id="gpmTabelaMapaBtOk"> Fechar </button></p></div></div>';
	document.body.appendChild( janelaTabelaDados );
	$('#gpmTabelaMapa').easyModal({'top':50});
}

// ---------------------------------------------------------------------------------------
// adicionaMapa()
// Adiciona um novo mapa à coleção de mapas
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.adicionaMapa = function( elemento, aDados, oFiltro, oOpcoes, fnCallback ) {


	// Determina o número do mapa
	this.mapaSelecionado = this.coleçãoMapas.length;
	
	// Teste de filtros por micro ou mesorregião, valores mínimo e máximo
	var filtroMicro = null, 
		filtroMeso = null, 
		minimo=-1, 
		maximo=-1;
	if( oFiltro != null )
		for( f in oFiltro ) {
			switch( f ) {
				case "micro":	filtroMicro = oFiltro[f];
								filtroMeso = this.dadosMicros[ this.rótulosMicros.indexOf('Código Meso') ];
								break;
				case "meso":	filtroMeso = oFiltro[f];
								break;
				case "mínimo":	minimo = oFiltro[f];
								break;
				case "máximo":  maximo = oFiltro[f];
								break;
				default:		console.log( "Filtro inválido na construção do mapa" );
			}
		}
		
	// configurações iniciais do mapa
	this.coleçãoMapas[this.mapaSelecionado] = {
		"elemento": elemento,																// elemento da página HTML que conterá o mapa
		"mapa": null,																		// mapa (objeto do Google Maps)
		"poligonos": null,																	// polígonos que representam o município
		"polilinhas": null,																	// polilinhas que representam as divisões regionais
		"limites": null,																	// limites dos polígonos
		"dica": null,																		// label ou rótulo que apresentará o nome do município, quando mouse estiver posicionado sobre ele
		"mapaNoFundo": (oOpcoes['mapaNoFundo']==undefined?false:oOpcoes['mapaNoFundo']),	// indica se usará o mapa clássico do Google Maps como fundo deste mapa
		"linhasCoords": null,																// Vetor que armazena as linhas de latitute e longitude
		"rótulosCoords": null,																// Vetor que armazena os rótulos das linhas de latitude e longitude
		"título": oOpcoes['títuloDoMapa'],														// título do mapa
		"subtítulo": (oOpcoes['subtítulo']==undefined?'':oOpcoes['subtítulo']),				// subtítulo do mapa, usado para filtros, datas ou quaisquer outras informações
		"títulosDaLegenda": oOpcoes['títuloDaLegenda'],										// título das legendas para as variáveis possíveis
		"rótulosDaTabela": oOpcoes['títuloNaTabela'],										// rótulos das variáveis possíveis
 		"variávelSelecionada": (oOpcoes['variávelSelecionada']==undefined?0:oOpcoes['variávelSelecionada']),
		"dados": aDados,																	// matriz com os dados para cada variável possível
		"casasDecimais": oOpcoes['casasDecimais'],											// quantidade de cadas decimais para cada variável possível
		"qtdeClasses": oOpcoes['quantidadeDeClasses'],										// quantidade de classes para a apresentação inicial
		"classes": (oOpcoes['classes']==undefined?[]:oOpcoes['classes']),					// divisões de classes
		"método": oOpcoes['método'],														// método de classificação a ser empregado na apresentação inicial
		"esquemaDeCores": (oOpcoes['esquemaDeCores']==undefined?"Vermelho":oOpcoes['esquemaDeCores']),
		"inversãoDoEsquemaDeCores": (oOpcoes['inversãoDoEsquemaDeCores']==undefined?false:oOpcoes['inversãoDoEsquemaDeCores']),
		"opacidade": (oOpcoes['opacidade']==undefined?1:oOpcoes['opacidade']),				// opacidade dos polígonos (para o caso de apresentar o mapa do Google Maps no fundo
		"mínimo": minimo,																	// filtro de valor mínimo para a variável selecionada
		"máximo": maximo,																	// filtro de valor máximo para a variável selecionada
		"meso": filtroMeso,																	// filtro de mesorregião
		"micro": filtroMicro,																// filtro de microrregião
		"controles": (oOpcoes['controles']==undefined?true:oOpcoes['controles']),			// exibição dos controles de zoom e pan
		"callback": fnCallback,																// função de callback para quando usuário aplicar filtro
		"zoomAtual": 6																		// Determina o valor do zoom atual para desenho da escala																
	}
	
  
	// Determina os limites do mapa, definidos por meio de um objeto da classe LatLngBounds da API Google Maps
  // Para determinar esses limites, são testados cada ponto de cada polígono de cada município.
  // Referência para este trecho: INIT_BOUNDS
	var limites = {
		oeste: Infinity, 
		leste: -Infinity,
		sul:   Infinity, 
		norte: -Infinity
	};
	var rotuloGeometria = this.rótulosMunicípios.indexOf( 'Geometria' );
	for (var i in this.dadosMunicipios ) {
		if( this.coleçãoMapas[this.mapaSelecionado]['micro']!=null && this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Micro' )] != this.coleçãoMapas[this.mapaSelecionado]['micro'] )
			continue;
		if( this.coleçãoMapas[this.mapaSelecionado]['meso']!=null && this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Meso' )] != this.coleçãoMapas[this.mapaSelecionado]['meso'] )
			continue;
		for( j in this.dadosMunicipios[i][rotuloGeometria] ) // Cada município é composto por um conjunto de polígonos
      for( k in this.dadosMunicipios[i][rotuloGeometria][j] ) {
        if( this.dadosMunicipios[i][rotuloGeometria][j][k][0] < limites.sul ) limites.sul = this.dadosMunicipios[i][rotuloGeometria][j][k][0];
        if( this.dadosMunicipios[i][rotuloGeometria][j][k][0] > limites.norte ) limites.norte = this.dadosMunicipios[i][rotuloGeometria][j][k][0];
        if( this.dadosMunicipios[i][rotuloGeometria][j][k][1] < limites.oeste ) limites.oeste = this.dadosMunicipios[i][rotuloGeometria][j][k][1];
        if( this.dadosMunicipios[i][rotuloGeometria][j][k][1] > limites.leste ) limites.leste = this.dadosMunicipios[i][rotuloGeometria][j][k][1];
      }
	}
	this.coleçãoMapas[this.mapaSelecionado]['limites'] = limites;
	var bounds = new google.maps.LatLngBounds(
		new google.maps.LatLng( limites.sul, limites.oeste ),
		new google.maps.LatLng( limites.norte, limites.leste )
	);

	
	// Define as opções de exibição do mapa, usando os próprios parâmetros da API Google Maps
  // Referência para este trecho: INIT_MAP
	var mapOptions = {
		zoom: 6,
		center: bounds.getCenter(),
		mapTypeControlOptions: {
			  mapTypeIds: ['coordinate', google.maps.MapTypeId.ROADMAP],
			  style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
			},
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		streetViewControl: false,
		mapTypeControl: false,
		panControl: this.coleçãoMapas[this.mapaSelecionado]['controles'],
		panControlOptions: {
			position: google.maps.ControlPosition.RIGHT_TOP
		},
		zoomControl: this.coleçãoMapas[this.mapaSelecionado]['controles'],
		zoomControlOptions: {
			style: google.maps.ZoomControlStyle.SMALL,
			position: google.maps.ControlPosition.RIGHT_TOP
		},
		scaleControl: false,
//		scaleControlOptions: {
//			position: google.maps.ControlPosition.BOTTOM_LEFT  // quando google.maps.visualRefresh == true, sempre ficará em BOTTOM_RIGHT
//		},
		numero: this.mapaSelecionado
	};
	this.coleçãoMapas[this.mapaSelecionado]['mapa'] = new google.maps.Map(document.getElementById(this.coleçãoMapas[this.mapaSelecionado]['elemento']),mapOptions);
	this.coleçãoMapas[this.mapaSelecionado]['mapa'].fitBounds( bounds );
  this.coleçãoMapas[this.mapaSelecionado]['mapa'].mapTypes.set('coordinate',new CoordMapType(this.mapaSelecionado));
  this.coleçãoMapas[this.mapaSelecionado]['mapa'].setMapTypeId('coordinate');
  var northControl = document.createElement('div');    // símbolo de norte apresentado no mapa
	northControl.innerHTML = '<img src="geopucminas/norte.png" style="padding-top:20px;padding-right:15px"/>';
	this.coleçãoMapas[this.mapaSelecionado]['mapa'].controls[google.maps.ControlPosition.TOP_RIGHT].push(northControl); 	


	// Insere e atualiza o controle personalizado de escala
	var metrosPorPixel = 156543.03392 * Math.cos(bounds.getCenter().lat() * Math.PI / 180) / Math.pow(2, this.coleçãoMapas[this.mapaSelecionado]['mapa'].getZoom() );
	var distancia = Math.pow(10,Math.ceil(Math.log(50*metrosPorPixel)/Math.LN10));
	var qtdePixel = distancia/metrosPorPixel;
	var j = 0;
	while( qtdePixel > 100 ) {
		j++;
		qtdePixel = (distancia*(1-j/10))/metrosPorPixel;
	}
	distancia *= (1-j/10);
	txtDistancia = (distancia>=1000?formataNumero(distancia/1000,0)+' km':formataNumero(distancia,0)+' m');

	var escala = document.createElement('div');
	escala.style.marginBottom = '7px';
	escala.innerHTML = 
		'<div class="gpmEscala" id="gpmEscala1-'+this.mapaSelecionado+'" style="display:inline-block;width:'+(qtdePixel/4)+'px;border:thin black solid;margin-left:10px;background:black"></div>'+
		'<div class="gpmEscala" id="gpmEscala2-'+this.mapaSelecionado+'" style="display:inline-block;width:'+(qtdePixel/4)+'px;border:thin black solid;background:white"></div>'+
		'<div class="gpmEscala" id="gpmEscala4-'+this.mapaSelecionado+'" style="display:inline-block;width:'+(qtdePixel/2)+'px;border:thin black solid;background:black"></div>'+
		' <span id="gpmEscalaDistancia-'+this.mapaSelecionado+'">'+txtDistancia+'</span>';
  	this.coleçãoMapas[this.mapaSelecionado]['mapa'].controls[google.maps.ControlPosition.BOTTOM_LEFT].push(escala); 	

	// Desenha os polígonos
	this.coleçãoMapas[this.mapaSelecionado]['poligonos'] = new Array();
	for( i in this.dadosMunicipios ) {
		if( this.coleçãoMapas[this.mapaSelecionado]['micro']!=null && this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Micro' )] != this.coleçãoMapas[this.mapaSelecionado]['micro'] )
			continue;
		if( this.coleçãoMapas[this.mapaSelecionado]['meso']!=null && this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Meso' )] != this.coleçãoMapas[this.mapaSelecionado]['meso'] )
			continue;
			
		var codMicro = this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Micro' )];
		var codMeso = this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Meso' )];
		var polMun = new Array();
		for( j in this.dadosMunicipios[i][rotuloGeometria] ) {
      var pMun = new Array();
      for( k in this.dadosMunicipios[i][rotuloGeometria][j] )
		    pMun.push( new google.maps.LatLng( this.dadosMunicipios[i][rotuloGeometria][j][k][0],this.dadosMunicipios[i][rotuloGeometria][j][k][1] ) );
      polMun.push( pMun );
    }
		this.coleçãoMapas[this.mapaSelecionado]['poligonos'].push( 
			new google.maps.Polygon({
				codigoMunicipio: i,
				nomeMunicipio: this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Nome Município' )],
				codigoMicro: codMicro,
				nomeMicro: this.dadosMicros[codMicro][this.rótulosMicros.indexOf( 'Nome Micro' )],
				codigoMeso: codMeso,
				nomeMeso: this.dadosMesos[codMeso][this.rótulosMesos.indexOf( 'Nome Meso' )],
				valor: 0,
				paths: polMun,
				strokeColor: '#000000',
				strokeOpacity: 0.8,
				strokeWeight: 0.5,
				fillColor: '#e0e0e0',
				fillOpacity: 0.65,
				zIndex: 3
			})
		);
		var ultimoPoligono = this.coleçãoMapas[this.mapaSelecionado]['poligonos'].length-1;
		this.coleçãoMapas[this.mapaSelecionado]['poligonos'][ultimoPoligono].setMap(this.coleçãoMapas[this.mapaSelecionado]['mapa']);
		google.maps.event.addListener( this.coleçãoMapas[this.mapaSelecionado]['poligonos'][ultimoPoligono], 'click', this.mostraJanelaInfo );
		google.maps.event.addListener( this.coleçãoMapas[this.mapaSelecionado]['poligonos'][ultimoPoligono], 'mouseout', this.ocultaDica );
		google.maps.event.addListener( this.coleçãoMapas[this.mapaSelecionado]['poligonos'][ultimoPoligono], 'mouseover', this.mostraDica );
		google.maps.event.addListener( this.coleçãoMapas[this.mapaSelecionado]['poligonos'][ultimoPoligono], 'mousemove', this.moveDica );
	}
	
	// Desenha as polilinhas que representam as divisões regionais
	this.coleçãoMapas[this.mapaSelecionado]['polilinhas'] = new Array();
	if( this.coleçãoMapas[this.mapaSelecionado]['meso'] == null && this.coleçãoMapas[this.mapaSelecionado]['micro'] == null) {   // Quando não há seleção de regiões
		for( i in this.dadosMesos ) {
			var rotMesoGeometria = this.rótulosMesos.indexOf( 'Geometria' );
			for( j=0; j<this.dadosMesos[i][rotMesoGeometria].length; j++ ) {
        var pMeso = new Array();
        for( k=0; k<this.dadosMesos[i][rotMesoGeometria][j].length; k++ )
				  pMeso.push( new google.maps.LatLng( this.dadosMesos[i][rotMesoGeometria][j][k][0],this.dadosMesos[i][rotMesoGeometria][j][k][1] ) ); 
        this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].push( 
          new google.maps.Polyline({
            path: pMeso,
            strokeColor: '#000000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            zIndex: 5
          })
        );
        var ultimaPolilinha = this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].length-1;
        this.coleçãoMapas[this.mapaSelecionado]['polilinhas'][ultimaPolilinha].setMap(this.coleçãoMapas[this.mapaSelecionado]['mapa']);
      }
		}
	}
	else if( this.coleçãoMapas[this.mapaSelecionado]['meso'] != null && this.coleçãoMapas[this.mapaSelecionado]['micro'] == null ) {  // quando há uma mesorregião selecionada
		for( i in this.dadosMicros ) {
			if( this.dadosMicros[i][this.rótulosMicros.indexOf('Código Meso')] == this.coleçãoMapas[this.mapaSelecionado]['meso']	) {
				var rotMicroGeometria = this.rótulosMicros.indexOf( 'Geometria' );
				for( j=0; j<this.dadosMicros[i][rotMicroGeometria].length; j++ ) {
          var pMicro = new Array();
          for( k=0; k<this.dadosMicros[i][rotMicroGeometria][j].length; k++ )
					  pMicro.push( new google.maps.LatLng( this.dadosMicros[i][rotMicroGeometria][j][k][0],this.dadosMicros[i][rotMicroGeometria][j][k][1] ) ); 
				  this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].push( 
            new google.maps.Polyline({
              path: pMicro,
              strokeColor: '#000000',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              zIndex: 5
            })
          );
          var ultimaPolilinha = this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].length-1;
          this.coleçãoMapas[this.mapaSelecionado]['polilinhas'][ultimaPolilinha].setMap(this.coleçãoMapas[this.mapaSelecionado]['mapa']);
        }
			}
		}
	}
	else if( this.coleçãoMapas[this.mapaSelecionado]['micro'] != null ) {  	// quando há uma microrregião selecionada
		var codMicro = this.coleçãoMapas[this.mapaSelecionado]['micro'];
		var rotMicroGeometria = this.rótulosMicros.indexOf( 'Geometria' );
		for( j=0; j<this.dadosMicros[codMicro][rotMicroGeometria].length; j++ ) {
      var pMicro = new Array();
      for( k=0; k<this.dadosMicros[codMicro][rotMicroGeometria][j].length; k++ )
			  pMicro.push( new google.maps.LatLng( this.dadosMicros[codMicro][rotMicroGeometria][j][k][0],this.dadosMicros[codMicro][rotMicroGeometria][j][k][1] ) ); 
      this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].push( 
        new google.maps.Polyline({
          path: pMicro,
          strokeColor: '#000000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          zIndex: 5
        })
      );
      var ultimaPolilinha = this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].length-1;
      this.coleçãoMapas[this.mapaSelecionado]['polilinhas'][ultimaPolilinha].setMap(this.coleçãoMapas[this.mapaSelecionado]['mapa']);
    }
	}
  
  
		
	// Janela de seleção de variável -----------------------------------------------------
	var jVariavel = $( "button[data-geopucminas='variável'][data-mapa='"+__gpmAutoRef.coleçãoMapas[this.mapaSelecionado]['elemento']+"']" );
	if( jVariavel.length > 0 ) {
		$( jVariavel ).click(function() {
			for( i in __gpmAutoRef.coleçãoMapas )
				if( __gpmAutoRef.coleçãoMapas[i]['elemento'] == this.getAttribute('data-mapa') ) {
					__gpmAutoRef.mapaSelecionado = i;
					break;
				}
			var opcoes = '';
			for( i=0; i<__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['títulosDaLegenda'].length; i++ )
				opcoes += '<option ' + (i==__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['variávelSelecionada']?'selected ':'') + 'value="'+i+'">'+__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['títulosDaLegenda'][i]+'</option>';
			$('#gpmVariavelMapa').html(opcoes);
			$('#gpmOpcoesVariavel').trigger('openModal');
		});
	
		$('#gpmOpcoesVariavelBtOK').click( function() {
			__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['variávelSelecionada'] = $('#gpmVariavelMapa').val();
			__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mínimo'] = -1;
			__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['máximo'] = -1;
			__gpmAutoRef.determinaClasses();    // refaz o mapa
			__gpmAutoRef.alteraMapa();
			__gpmAutoRef.desenhaLinhas(__gpmAutoRef.mapaSelecionado);
			$('#gpmOpcoesVariavel').trigger('closeModal');
		});

		$('#gpmOpcoesVariavelBtCancel').click( function() {
			$('#gpmOpcoesVariavel').trigger('closeModal');
		});
	};

	// Janela de configuração de opções do mapa ------------------------------------------
	var jOpcoes = $( "button[data-geopucminas='opções'][data-mapa='"+__gpmAutoRef.coleçãoMapas[this.mapaSelecionado]['elemento']+"']" );
	if( jOpcoes.length > 0 ) {
		$( jOpcoes ).click(function() {
			for( i in __gpmAutoRef.coleçãoMapas )
				if( __gpmAutoRef.coleçãoMapas[i]['elemento'] == this.getAttribute('data-mapa') ) {
					__gpmAutoRef.mapaSelecionado = i;
					break;
				}
			$('#gpmMapaFundo').prop('checked',__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mapaNoFundo']);
			$('#gpmControlesMapa').prop('checked',__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['controles']);
			$('#gpmTransparencia').val( Math.round((1-__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['opacidade'])*100));
			$('#gpmQtdeClasses').val(__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['qtdeClasses']);
			$('#gpmMetodo').val(__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['método']);
			$('#gpmEsquemaCores').val(__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['esquemaDeCores']);
			$('#gpmInverterCores').prop('checked',__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['inversãoDoEsquemaDeCores']);
			if( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mínimo'] == -1 )
				$('#gpmMinimo').val("");
			else
				$('#gpmMinimo').val(__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mínimo']);
			if( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['máximo'] == -1 )
				$('#gpmMaximo').val("");
			else
				$('#gpmMaximo').val(__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['máximo']);
			if( $('#gpmMetodo').val() != 'manual' ) {
				$("#gpmIntervalosManuais").val('');
				$("#gpmIntervalosManuais").prop('placeholder', 'automático');
				$("#gpmIntervalosManuais").prop('disabled', true);
				$("#gpmQtdeClasses").prop('disabled', false);
			}
			else {
				$('#gpmIntervalosManuais').val( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['classes'].join(';') );
				$("#gpmIntervalosManuais").prop('disabled', false);
				$("#gpmQtdeClasses").prop('disabled', true);
				
			}
			$('#gpmOpcoesMapa').trigger('openModal');
		});

		$('#gpmOpcoesMapaBtOk').click( function() {
			__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mapaNoFundo'] = $('#gpmMapaFundo').prop('checked');
			__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['controles'] = $('#gpmControlesMapa').prop('checked');
			__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['opacidade'] = 1-($('#gpmTransparencia').val()/100);
			__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['qtdeClasses'] = $('#gpmQtdeClasses').val();
			__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['método'] = $('#gpmMetodo').val();
			__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['esquemaDeCores'] = $('#gpmEsquemaCores').val();
			__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['inversãoDoEsquemaDeCores'] = $('#gpmInverterCores').prop('checked');
			if( $('#gpmMinimo').val() == "" )
				__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mínimo'] = -1;
			else
				__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mínimo'] = $('#gpmMinimo').val();
			if( $('#gpmMaximo').val() == "" )
				__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['máximo'] = -1;
			else
				__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['máximo'] = $('#gpmMaximo').val();
		
			if( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['controles'] ) 
				__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mapa'].setOptions( { panControl: true, zoomControl: true } );
			else
				__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mapa'].setOptions( { panControl: false, zoomControl: false } );
			if( $('#gpmMetodo').val() == 'manual' ) {
				var vAux = $('#gpmIntervalosManuais').val().split(';');
				__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['classes'] = new Array();
				for( i=0; i<vAux.length; i++ ) 
					__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['classes'].push( parseFloat( vAux[i] ) );
			}
			__gpmAutoRef.determinaClasses();
			__gpmAutoRef.alteraMapa();
			__gpmAutoRef.desenhaLinhas(__gpmAutoRef.mapaSelecionado);
			$('#gpmOpcoesMapa').trigger('closeModal');
		});
		$('#gpmOpcoesMapaBtCancel').click( function() {
			$('#gpmOpcoesMapa').trigger('closeModal');
		});
		$( '#gpmMetodo' ).change( function() {
			if( $('#gpmMetodo').val() == 'manual' ) {
				$("#gpmIntervalosManuais").prop('disabled', false);
				$("#gpmQtdeClasses").prop('disabled', true);
				$('#gpmIntervalosManuais').val( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['classes'].join(';') );
			}
			else {
				$("#gpmIntervalosManuais").val('');
				$("#gpmIntervalosManuais").prop('placeholder', 'automático');
				$("#gpmIntervalosManuais").prop('disabled', true);
				$("#gpmQtdeClasses").prop('disabled', false);
			}
		} );
	}

	// Janela com tabela de dados --------------------------------------------------------
	var jTabela = $( "button[data-geopucminas='tabela'][data-mapa='"+__gpmAutoRef.coleçãoMapas[this.mapaSelecionado]['elemento']+"']" );
	if( jTabela.length > 0 ) {
		$( jTabela ).click(function() {
			for( i in __gpmAutoRef.coleçãoMapas )
				if( __gpmAutoRef.coleçãoMapas[i]['elemento'] == this.getAttribute('data-mapa') ) {
					__gpmAutoRef.mapaSelecionado = i;
					break;
				}
			$('#gpmTabelaMapa h3').html(__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['título']);
			var sRegiao = __gpmAutoRef.estados[__gpmAutoRef.uf];
			if( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['micro']!=null) {
				sRegiao = 'Microrregião: '+__gpmAutoRef.dadosMicros[__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['micro']][ __gpmAutoRef.rótulosMicros.indexOf( 'Nome Micro' ) ];
			}
			else if( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['meso']!=null) {
				sRegiao = 'Mesorregião: '+__gpmAutoRef.dadosMesos[__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['meso']][ __gpmAutoRef.rótulosMesos.indexOf( 'Nome Meso' ) ];
			}
			var subtítulo = __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['subtítulo'];
			if( subtítulo != '' )
				subtítulo += '<br/>';
			$('#gpmTabelaMapa h5').html(subtítulo+sRegiao);
			
			var sRotulos = '<tr><th><a href="javascript:__gpmAutoRef.ordenaTabela(0)">Município</a></th>';
			for( i in __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['títulosDaLegenda'] ) 
				sRotulos += '<th><a href="javascript:__gpmAutoRef.ordenaTabela('+(parseInt(i)+1)+')">'+__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['rótulosDaTabela'][i]+'</a></th>';
			sRotulos += '</tr>';
			$('#gpmTabelaMapa thead').html(sRotulos);
			
			__gpmAutoRef.dadosTabela = new Array();
			for( i in __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['dados'][__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['variávelSelecionada']] )
				if(  (minimo==-1 || __gpmAutoRef.olecaoMapas[__gpmAutoRef.mapaSelecionado]['dados'][__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['variávelSelecionada']][i]>=minimo ) &&
					 (maximo==-1 || __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['dados'][__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['variávelSelecionada']][i]<=maximo ) &&
					 (__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['micro']==null || __gpmAutoRef.dadosMunicipios[i][__gpmAutoRef.rótulosMunicípios.indexOf('Código Micro')]==__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['micro'] ) &&
					 (__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['meso']==null  || __gpmAutoRef.dadosMunicipios[i][__gpmAutoRef.rótulosMunicípios.indexOf('Código Meso')]==__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['meso'] ) ) {
						 var dadosAux = new Array();
						 dadosAux.push( __gpmAutoRef.dadosMunicipios[i][__gpmAutoRef.rótulosMunicípios.indexOf( 'Nome Município' )] );
						 for( j in __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['dados'] )
							dadosAux.push( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['dados'][j][i] );
						 __gpmAutoRef.dadosTabela.push( dadosAux );
				}
			__gpmAutoRef.ordenaTabela( 0 );

			// rodape
			__gpmAutoRef.totaisTabela = new Array();
			for( j=1; j<__gpmAutoRef.dadosTabela[0].length; j++ )
				__gpmAutoRef.totaisTabela.push(0);
			for( i in __gpmAutoRef.dadosTabela )
				for( j=1; j<__gpmAutoRef.dadosTabela[i].length; j++ )
					__gpmAutoRef.totaisTabela[j-1] += __gpmAutoRef.dadosTabela[i][j];
			var sRodape = '<tr><td></td>';
			for( j in __gpmAutoRef.totaisTabela )
				sRodape += '<td style="text-align:right">'+formataArredondado(__gpmAutoRef.totaisTabela[j],__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['casasDecimais'][j])+'</td>';
			sRodape += '</tr>';
			$('#gpmTabelaMapa tfoot').html(sRodape);
			$('#gpmTabelaMapa').trigger('openModal');
		});
		$('#gpmTabelaMapaBtOk').click( function() {
			$('#gpmTabelaMapa').trigger('closeModal');
		});
	};

	// Ativação da janela para impressão
	var jCaptura = $( "button[data-geopucminas='capturar'][data-mapa='"+__gpmAutoRef.coleçãoMapas[this.mapaSelecionado]['elemento']+"']" );
	if( jCaptura.length > 0 ) {
		$( jCaptura ).click(function() {
			for( i in __gpmAutoRef.coleçãoMapas )
				if( __gpmAutoRef.coleçãoMapas[i]['elemento'] == this.getAttribute('data-mapa') ) {
					__gpmAutoRef.mapaSelecionado = i;
					break;
				}
			var novaJanela = window.open( '', '_blank', 'location=no,scrollbars=yes,width=650,height=610' );
			novaJanela.document.write( '<html><head><title>'+__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['título']+'</title><meta charset="utf-8" /><script src="http://code.jquery.com/jquery-1.8.2.js"></script><script src="html2canvas.js"></script><script src="https://maps.googleapis.com/maps/api/js?sensor=false"></script><script src="MG_Geometria2.js"></script><script src="MG_Dados.js"></script><script src="geopucminas2.js"></script><link rel="stylesheet" href="geopucminas2.css"/><style>body {margin:0; padding:0} #corpo {margin:20px 2% 0px 2%;padding:0;width:96%;height:83%;border:thin black solid} #fonte > p, #controles {font-family: calibri, sans-serif;font-size:small; width:96%; margin-top:3px; padding:0;margin-left:2%} #imagem { margin-top: 20px; }</style><script>' );
			novaJanela.document.write( "window.setTimeout(function(){desenha();}, 500);" );
			var filtroMapa1 = new Object();
			if( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mínimo'] != -1 ) filtroMapa1['mínimo'] = __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['mínimo'];
			if( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['máximo'] != -1 ) filtroMapa1['máximo'] = __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['máximo'];
			if( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['micro'] != null ) filtroMapa1['micro'] = __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['micro'];
			if( __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['meso'] != null ) filtroMapa1['meso'] = __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['meso'];

			var opcoesMapa1 = {
				título: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['título'],
				rótulosDaTabela: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['rótulosDaTabela'],
				títulosDaLegenda: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['títulosDosCampos'],
				variávelSelecionada: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['variávelSelecionada'],
				método: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['método'],
				classes: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['qtdeClasses'],
				casasDecimais: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['casasDecimais'],
				mapaNoFundo: false,
				esquemaDeCores: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['esquemaDeCores'],
				inversãoDoEsquemaDeCores: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['inversãoDoEsquemaDeCores'],
				opacidade: 1
			}
			var dados1 = '[';
			for( var i in __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['dados'] ) {
				dados1 += '{';
				for( var j in __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['dados'][i] )
					dados1 += j+":"+__gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['dados'][i][j]+",";
				dados1 = dados1.slice( 0, dados1.length-1 ) + "},";
			}
			dados1 = dados1.slice( 0, dados1.length-1 ) + "]";
		
			// Desenho do mapa e do indicador de escala
			novaJanela.document.write( 'function desenha() {\n');
			novaJanela.document.write( "var gpm = new GeoPUCMinas('MG');" );
			novaJanela.document.write( 'gpm.adicionaMapa( "corpo", '+dados1+',' + JSON.stringify(filtroMapa1)+ ','+JSON.stringify(opcoesMapa1)+' );\n' );
			novaJanela.document.write( 'p1 = new google.maps.LatLng( -22.5, -50.5 );p2 = destino( p1, 90, 50 );p2a = new google.maps.LatLng( p2.lat()-0.10, p2.lng() );var rb1 = new google.maps.LatLngBounds( p1, p2a );var rect1 = new google.maps.Rectangle( {map: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]["mapa"],bounds: rb1,strokeWeight: 1,strokeColor: "#000000",fillColor: "#000000",fillOpacity: 1} );p3 = destino( p2, 90, 50 );p3a = new google.maps.LatLng( p3.lat()-0.10, p3.lng() );var rb2 = new google.maps.LatLngBounds( p2, p3a );var rect2 = new google.maps.Rectangle( {map: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]["mapa"],bounds: rb2,strokeWeight: 1,strokeColor: "#000000",fillColor: "#FFFFFF",fillOpacity: 1} );p4 = destino( p3, 90, 100 );p4a = new google.maps.LatLng( p4.lat()-0.10, p4.lng() );var rb3 = new google.maps.LatLngBounds( p3, p4a );var rect3 = new google.maps.Rectangle( {map: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]["mapa"],bounds: rb3,strokeWeight: 1,strokeColor: "#000000",fillColor: "#000000",fillOpacity: 1} );rotulo1 = new Label({map: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]["mapa"],text: "0",visible: true,position: new google.maps.LatLng( p1.lat()-0.11, p1.lng() ),zIndex: 8});rotulo1.setStyle( "left", "-50%" );rotulo1.setStyle( "top", "0" );rotulo1.setStyle( "border", "none" );rotulo1.setStyle( "font-size", "small" );rotulo2 = new Label({map: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]["mapa"],text: "50",visible: true,position: new google.maps.LatLng( p2.lat()-0.11, p2.lng() ),zIndex: 8});rotulo2.setStyle( "left", "-50%" );rotulo2.setStyle( "top", "0" );rotulo2.setStyle( "border", "none" );rotulo2.setStyle( "font-size", "small" );rotulo3 = new Label({map: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]["mapa"],text: "100",visible: true,position: new google.maps.LatLng( p3.lat()-0.11, p3.lng() ),zIndex: 8});rotulo3.setStyle( "left", "-50%" );rotulo3.setStyle( "top", "0" );rotulo3.setStyle( "border", "none" );rotulo3.setStyle( "font-size", "small" );rotulo4 = new Label({map: __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]["mapa"],text: "200 km",visible: true,position: new google.maps.LatLng( p4.lat()-0.11, p4.lng() ),zIndex: 8});rotulo4.setStyle( "left", "-20%" );rotulo4.setStyle( "top", "0" );rotulo4.setStyle( "border", "none" );rotulo4.setStyle( "font-size", "small" );' );
			novaJanela.document.write( '}' );
			novaJanela.document.write( 'function destino( p1,direcao,d){var R = 6371;var brng = direcao*(Math.PI/180);var lat1 = p1.lat()*Math.PI/180;var lon1 = p1.lng()*Math.PI/180;var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng) );var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(lat1),Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2)); var p2 = new google.maps.LatLng( lat2*180/Math.PI, lon2*180/Math.PI ); return p2;}' );

			// Rotina para captura da tela
			novaJanela.document.write( 'function imprimeMapa() {html2canvas(document.getElementById( "mapa" ), { onrendered: function(canvas) {	window.open(canvas.toDataURL(),"_self"); } });}\n' );
			novaJanela.document.write( '</script></head><body><div id="mapa"><div id="corpo"></div><div id="fonte"><p><strong>Fonte:</strong> KUTOVA, 2013<br/><strong>Organização:</strong> Marcos André S. Kutova</p></div></div><div id="controles"><p>Ajuste as dimensões da tela e o posicionamento do mapa e clique neste botão: <button onclick="imprimeMapa()">Capturar</button> ');

			// Desenho da página
//			novaJanela.document.write ('<button onclick="fcontroles()" id="btControles">Exibir controles</button>' );
			novaJanela.document.write ('</p></div></body></html>' );
		});
	}
	
	// Dicas (tooltip) - informa o nome do município sob o cursor do mouse		
	this.coleçãoMapas[this.mapaSelecionado]['dica'] = new Label({
	  map: this.coleçãoMapas[this.mapaSelecionado]['mapa'],
	  text: '',
	  visible: false,
	  position: new google.maps.LatLng(-19, -45),
	  zIndex: 5
	});
	
	// desenha linhas de latitudes e longitudes
	var nMapa = this.mapaSelecionado;
	this.coleçãoMapas[this.mapaSelecionado]['rótulosCoords'] = new Array();
	this.coleçãoMapas[this.mapaSelecionado]['linhasCoords'] = new Array();
	google.maps.event.addListener(this.coleçãoMapas[nMapa]['mapa'], 'bounds_changed', this.desenhaLinhas );
	
	// Cria a janela de diálogo interna dos mapas
	this.infoWindow = new google.maps.InfoWindow();
	
	// Título
	var sRegiao = this.estados[this.uf];
	if( this.coleçãoMapas[this.mapaSelecionado]['micro']!=null) {
		sRegiao = 'Microrregião: '+this.dadosMicros[this.coleçãoMapas[this.mapaSelecionado]['micro']][ this.rótulosMicros.indexOf( 'Nome Micro' ) ];
	}
	else if( this.coleçãoMapas[this.mapaSelecionado]['meso']!=null) {
		sRegiao = 'Mesorregião: '+this.dadosMesos[this.coleçãoMapas[this.mapaSelecionado]['meso']][ this.rótulosMesos.indexOf( 'Nome Meso' ) ];
	}

	var subtítulo = __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['subtítulo'];
	if( subtítulo != '' )
		subtítulo += '<br/>';

	var caixaTítulo = document.createElement('div');
	caixaTítulo.id = 'caixaTítulo-'+this.mapaSelecionado;
	caixaTítulo.setAttribute( 'class', 'gpmCaixaTítulo' );
	caixaTítulo.index = 1;
	caixaTítulo.innerHTML = '<p style="margin-bottom:1ex;line-height:1">'+this.coleçãoMapas[this.mapaSelecionado]['título']+'</span><br/><span style="font-size:80%;font-weight:normal" id="subtitulo">'+subtítulo+'</span><span style="font-size:80%;font-weight:normal" id="regiao">'+sRegiao+'</span></p>';
	caixaTítulo.style.marginTop = '17px';
	this.coleçãoMapas[this.mapaSelecionado]['mapa'].controls[google.maps.ControlPosition.TOP_LEFT].push(caixaTítulo);

	// Executa a rotina da determinação das classes
	this.determinaClasses();
	
	// Cria a legenda
	var caixaLegenda = document.createElement('div');
	caixaLegenda.id = 'caixaLegenda-'+this.mapaSelecionado;
	caixaLegenda.index = 1;
	caixaLegenda.innerHTML = this.montaLegenda();
	this.coleçãoMapas[this.mapaSelecionado]['mapa'].controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(caixaLegenda);
		
	// Reconstrói o mapa a partir das novas classes
	this.alteraMapa();

	// Dispara uma atualização das linhas de latitude e longitude a cada 2 segundos (necessária apenas quando o mapa é redimensionado)
	// Caso a HTML5 incorpore algum evento associado ao redimensionamento de <div>s, então esse comando deve ser alterado
	this.intervalID = window.setInterval( this.redimensiona, 2000 );
}


// ---------------------------------------------------------------------------------------
// alteraDados()
// Altera a ordem da tabela de dados do mapa ativo (com a tabela sendo exibida)
// Essa rotina deve ser chamada apenas quando o conjunto de dados usados na construção
// do mapa será alterada. Isso acontece quando um filtro externo é aplicado. 
// Parâmetros:
//		número do mapa a ser alterado
//		novo título para o mapa
//		novos títulos para a legenda
//		novos dados
//		novos rótulos para a construção da tabela
//		novas quantidades de casas decimais
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.alteraDados = function( nm, sTitulo, sSubtitulo, sLegenda, dados, sRotulos, decimais ) {

	this.coleçãoMapas[nm]["título"] = sTitulo;
	this.coleçãoMapas[nm]["subtítulo"] = sSubtitulo;
	this.coleçãoMapas[nm]["títulosDaLegenda"] = sLegenda;
	this.coleçãoMapas[nm]["rótulosDaTabela"] = sRotulos;
	this.coleçãoMapas[nm]["variávelSelecionada"] = 0;
	this.coleçãoMapas[nm]["dados"] = dados;
	this.coleçãoMapas[nm]["casasDecimais"] = decimais;

	this.determinaClasses();
	this.alteraMapa();

}


// ---------------------------------------------------------------------------------------
// alteraEscala()
// Altera o filtro de região, provocando uma mudança de escala
// Essa rotina aplica um filtro de micro ou mesorregião (ou limpa o filtro)
// Parâmetros:
//		número do mapa a ser alterado
//		null (para todo o estado) ou objeto contendo micro/mesorregião selecionada
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.alteraEscala = function( nm, oFiltro  ) {

	this.mapaSelecionado = nm;
	this.infoWindow.close();

	// Teste de filtros por micro ou mesorregião
	var filtroMicro = null, 
		filtroMeso = null;
	if( oFiltro != null )
		for( f in oFiltro ) {
			switch( f ) {
				case "micro":	filtroMicro = oFiltro[f];
								filtroMeso = this.dadosMicros[ this.rótulosMicros.indexOf('Código Meso') ];
								break;
				case "meso":	filtroMeso = oFiltro[f];
								break;
				default:		console.log( "Filtro inválido na construção do mapa" );
			}
		}

	// Elimina os filtros de valores, que podem provocar uma determinação inadequada das classes 
	this.coleçãoMapas[this.mapaSelecionado]['mínimo'] = -1;
	this.coleçãoMapas[this.mapaSelecionado]['máximo'] = -1;
	this.coleçãoMapas[this.mapaSelecionado]['micro'] = filtroMicro;
	this.coleçãoMapas[this.mapaSelecionado]['meso'] = filtroMeso;
				
	// Determina o centro e os limites do mapa
	var limites = {
		oeste: Infinity, 
		leste: -Infinity,
		sul:   Infinity, 
		norte: -Infinity
	};
	var rotuloGeometria = this.rótulosMunicípios.indexOf( 'Geometria' );
	for (var i in this.dadosMunicipios ) {
		if( this.coleçãoMapas[this.mapaSelecionado]['micro']!=null && this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Micro' )] != this.coleçãoMapas[this.mapaSelecionado]['micro'] )
			continue;
		if( this.coleçãoMapas[this.mapaSelecionado]['meso']!=null && this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Meso' )] != this.coleçãoMapas[this.mapaSelecionado]['meso'] )
			continue;
		for( j in this.dadosMunicipios[i][rotuloGeometria] ) // Cada município é composto por um conjunto de polígonos
      for( k in this.dadosMunicipios[i][rotuloGeometria][j] ) {
        if( this.dadosMunicipios[i][rotuloGeometria][j][k][0] < limites.sul ) limites.sul = this.dadosMunicipios[i][rotuloGeometria][j][k][0];
        if( this.dadosMunicipios[i][rotuloGeometria][j][k][0] > limites.norte ) limites.norte = this.dadosMunicipios[i][rotuloGeometria][j][k][0];
        if( this.dadosMunicipios[i][rotuloGeometria][j][k][1] < limites.oeste ) limites.oeste = this.dadosMunicipios[i][rotuloGeometria][j][k][1];
        if( this.dadosMunicipios[i][rotuloGeometria][j][k][1] > limites.leste ) limites.leste = this.dadosMunicipios[i][rotuloGeometria][j][k][1];
      }
	}
	this.coleçãoMapas[this.mapaSelecionado]['limites'] = limites;
	var bounds = new google.maps.LatLngBounds(
		new google.maps.LatLng( limites.sul, limites.oeste ),
		new google.maps.LatLng( limites.norte, limites.leste )
	);
	this.coleçãoMapas[this.mapaSelecionado]['mapa'].fitBounds( bounds );
	
	// Remove os polígonos e polilinhas atuais
	for( i=0; i<this.coleçãoMapas[this.mapaSelecionado]['poligonos'].length; i++ )
		this.coleçãoMapas[this.mapaSelecionado]['poligonos'][i].setMap(null);
	for( i=0; i<this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].length; i++ )
		this.coleçãoMapas[this.mapaSelecionado]['polilinhas'][i].setMap(null);
	
	// Atualiza os polígonos
	this.coleçãoMapas[this.mapaSelecionado]['poligonos'] = new Array();
	for( i in this.dadosMunicipios ) {
		if( this.coleçãoMapas[this.mapaSelecionado]['micro']!=null && this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Micro' )] != this.coleçãoMapas[this.mapaSelecionado]['micro'] )
			continue;
		if( this.coleçãoMapas[this.mapaSelecionado]['meso']!=null && this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Meso' )] != this.coleçãoMapas[this.mapaSelecionado]['meso'] )
			continue;
			
		var codMicro = this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Micro' )];
		var codMeso = this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Meso' )];
		
    var polMun = new Array();
		for( j in this.dadosMunicipios[i][rotuloGeometria] ) {
      var pMun = new Array();
      for( k in this.dadosMunicipios[i][rotuloGeometria][j] )
		    pMun.push( new google.maps.LatLng( this.dadosMunicipios[i][rotuloGeometria][j][k][0],this.dadosMunicipios[i][rotuloGeometria][j][k][1] ) );
      polMun.push( pMun );
    }
    this.coleçãoMapas[this.mapaSelecionado]['poligonos'].push( 
			new google.maps.Polygon({
				codigoMunicipio: i,
				nomeMunicipio: this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Nome Município' )],
				codigoMicro: codMicro,
				nomeMicro: this.dadosMicros[codMicro][this.rótulosMicros.indexOf( 'Nome Micro' )],
				codigoMeso: codMeso,
				nomeMeso: this.dadosMesos[codMeso][this.rótulosMesos.indexOf( 'Nome Meso' )],
				valor: 0,
				paths: polMun,
				strokeColor: '#000000',
				strokeOpacity: 0.8,
				strokeWeight: 0.5,
				fillColor: '#e0e0e0',
				fillOpacity: 0.65,
				zIndex: 3
			})
		);
		var ultimoPoligono = this.coleçãoMapas[this.mapaSelecionado]['poligonos'].length-1;
		this.coleçãoMapas[this.mapaSelecionado]['poligonos'][ultimoPoligono].setMap(this.coleçãoMapas[this.mapaSelecionado]['mapa']);
		google.maps.event.addListener( this.coleçãoMapas[this.mapaSelecionado]['poligonos'][ultimoPoligono], 'click', this.mostraJanelaInfo );
		google.maps.event.addListener( this.coleçãoMapas[this.mapaSelecionado]['poligonos'][ultimoPoligono], 'mouseout', this.ocultaDica );
		google.maps.event.addListener( this.coleçãoMapas[this.mapaSelecionado]['poligonos'][ultimoPoligono], 'mouseover', this.mostraDica );
		google.maps.event.addListener( this.coleçãoMapas[this.mapaSelecionado]['poligonos'][ultimoPoligono], 'mousemove', this.moveDica );
	}
	
	// Desenha as polilinhas que representam as divisões regionais
	this.coleçãoMapas[this.mapaSelecionado]['polilinhas'] = new Array();
	if( this.coleçãoMapas[this.mapaSelecionado]['meso'] == null && this.coleçãoMapas[this.mapaSelecionado]['micro'] == null) {   // Quando não há seleção de regiões
		for( i in this.dadosMesos ) {
			var rotMesoGeometria = this.rótulosMesos.indexOf( 'Geometria' );
			for( j=0; j<this.dadosMesos[i][rotMesoGeometria].length; j++ ) {
        var pMeso = new Array();
        for( k=0; k<this.dadosMesos[i][rotMesoGeometria][j].length; k++ )
				  pMeso.push( new google.maps.LatLng( this.dadosMesos[i][rotMesoGeometria][j][k][0],this.dadosMesos[i][rotMesoGeometria][j][k][1] ) ); 
        this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].push( 
          new google.maps.Polyline({
            path: pMeso,
            strokeColor: '#000000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            zIndex: 5
          })
        );
        var ultimaPolilinha = this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].length-1;
        this.coleçãoMapas[this.mapaSelecionado]['polilinhas'][ultimaPolilinha].setMap(this.coleçãoMapas[this.mapaSelecionado]['mapa']);
      }
		}
	}
	else if( this.coleçãoMapas[this.mapaSelecionado]['meso'] != null && this.coleçãoMapas[this.mapaSelecionado]['micro'] == null ) {  // quando há uma mesorregião selecionada
		for( i in this.dadosMicros ) {
			if( this.dadosMicros[i][this.rótulosMicros.indexOf('Código Meso')] == this.coleçãoMapas[this.mapaSelecionado]['meso']	) {
				var rotMicroGeometria = this.rótulosMicros.indexOf( 'Geometria' );
				for( j=0; j<this.dadosMicros[i][rotMicroGeometria].length; j++ ) {
          var pMicro = new Array();
          for( k=0; k<this.dadosMicros[i][rotMicroGeometria][j].length; k++ )
					  pMicro.push( new google.maps.LatLng( this.dadosMicros[i][rotMicroGeometria][j][k][0],this.dadosMicros[i][rotMicroGeometria][j][k][1] ) ); 
				  this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].push( 
            new google.maps.Polyline({
              path: pMicro,
              strokeColor: '#000000',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              zIndex: 5
            })
          );
          var ultimaPolilinha = this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].length-1;
          this.coleçãoMapas[this.mapaSelecionado]['polilinhas'][ultimaPolilinha].setMap(this.coleçãoMapas[this.mapaSelecionado]['mapa']);
        }
			}
		}
	}
	else if( this.coleçãoMapas[this.mapaSelecionado]['micro'] != null ) {  	// quando há uma microrregião selecionada
		var codMicro = this.coleçãoMapas[this.mapaSelecionado]['micro'];
		var rotMicroGeometria = this.rótulosMicros.indexOf( 'Geometria' );
		for( j=0; j<this.dadosMicros[codMicro][rotMicroGeometria].length; j++ ) {
      var pMicro = new Array();
      for( k=0; k<this.dadosMicros[codMicro][rotMicroGeometria][j].length; k++ )
			  pMicro.push( new google.maps.LatLng( this.dadosMicros[codMicro][rotMicroGeometria][j][k][0],this.dadosMicros[codMicro][rotMicroGeometria][j][k][1] ) ); 
      this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].push( 
        new google.maps.Polyline({
          path: pMicro,
          strokeColor: '#000000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          zIndex: 5
        })
      );
      var ultimaPolilinha = this.coleçãoMapas[this.mapaSelecionado]['polilinhas'].length-1;
      this.coleçãoMapas[this.mapaSelecionado]['polilinhas'][ultimaPolilinha].setMap(this.coleçãoMapas[this.mapaSelecionado]['mapa']);
    }
	}
   
		
	// Gera novas classes e redesenha o mapa
	this.determinaClasses();
	this.alteraMapa();
}


// ---------------------------------------------------------------------------------------
// determinaClasses() - ROTINA INTERNA
// Calcula as novas divisões de classe, considerando o conjunto de dados, o critério de 
// classificação e a quantidade de classes já especificadas no mapa
// Parâmetros:
//		número do mapa a ser alterado
//		null (para todo o estado) ou objeto contendo micro/mesorregião selecionada
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.determinaClasses = function() {

		// Encontra os municípios que atendam aos critérios de seleção regional
		var minimo = this.coleçãoMapas[this.mapaSelecionado]['mínimo'];
		var maximo = this.coleçãoMapas[this.mapaSelecionado]['máximo'];
		var dados = [];
		var rótuloMicro = this.rótulosMunicípios.indexOf( 'Código Micro' );
		var rótuloMeso = this.rótulosMunicípios.indexOf( 'Código Meso' );
		for( i in this.coleçãoMapas[this.mapaSelecionado]['dados'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']] )
			if(  (minimo==-1 || this.coleçãoMapas[this.mapaSelecionado]['dados'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']][i]>=minimo ) &&
				 (maximo==-1 || this.coleçãoMapas[this.mapaSelecionado]['dados'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']][i]<=maximo ) &&
				 (this.coleçãoMapas[this.mapaSelecionado]['micro']==null || this.dadosMunicipios[i][rótuloMicro]==this.coleçãoMapas[this.mapaSelecionado]['micro'] ) &&
				 (this.coleçãoMapas[this.mapaSelecionado]['meso']==null  || this.dadosMunicipios[i][rótuloMeso]==this.coleçãoMapas[this.mapaSelecionado]['meso'] ) )
				 dados.push( this.coleçãoMapas[this.mapaSelecionado]['dados'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']][i] );
			
		// Determina as classes, de acordo com o método selecionado	 
		var nClasses = this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses'];
		if( nClasses >= dados.length )
			nClasses = dados.length - 1;
		if( this.coleçãoMapas[this.mapaSelecionado]['método'] == 'quebras naturais' )
			this.coleçãoMapas[this.mapaSelecionado]['classes'] = getJenksBreaks( dados, nClasses, this.coleçãoMapas[this.mapaSelecionado]['casasDecimais'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']] );
		else if( this.coleçãoMapas[this.mapaSelecionado]['método'] == 'amplitude' )
			this.coleçãoMapas[this.mapaSelecionado]['classes'] = getEqualBreaks( dados, nClasses, this.coleçãoMapas[this.mapaSelecionado]['casasDecimais'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']] );
		else if( this.coleçãoMapas[this.mapaSelecionado]['método'] == 'quantis' )
			this.coleçãoMapas[this.mapaSelecionado]['classes'] = getQuantilesBreaks( dados, nClasses, this.coleçãoMapas[this.mapaSelecionado]['casasDecimais'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']] );
		else {
			// método manual, classes já estão definidas. Nada a fazer.
		}

		// A quantidade de classes obtidas pode ser inferior à quantidade de classes especificada
		this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses'] = this.coleçãoMapas[this.mapaSelecionado]['classes'].length - 1;
		if( this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses'] == 1 && 		// tem que existir no mínimo 2 classes
			this.coleçãoMapas[this.mapaSelecionado]['classes'][0] != this.coleçãoMapas[this.mapaSelecionado]['classes'][1] ) {
				this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']++;
				this.coleçãoMapas[this.mapaSelecionado]['classes'][2] = this.coleçãoMapas[this.mapaSelecionado]['classes'][1];
		}

}		


// ---------------------------------------------------------------------------------------
// alteraMapa() - ROTINA INTERNA
// Atualiza os polígonos, título e legenda, a partir das configurações do mapa selecionado.
// Chama também a função callback caso exista
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.alteraMapa = function() {

	// identifica valores de máximo e mínimo
	var minimo = this.coleçãoMapas[this.mapaSelecionado]['mínimo'];
	var maximo = this.coleçãoMapas[this.mapaSelecionado]['máximo'];

	// fundo
	if( this.coleçãoMapas[this.mapaSelecionado]['mapaNoFundo'] )
		this.coleçãoMapas[this.mapaSelecionado]['mapa'].setMapTypeId(google.maps.MapTypeId.ROADMAP)
	else
		this.coleçãoMapas[this.mapaSelecionado]['mapa'].setMapTypeId( 'coordinate')
		
	// Modifica polígonos
	var pot = Math.pow( 10, this.coleçãoMapas[this.mapaSelecionado]['casasDecimais'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']] );
	for( i=0; i<this.coleçãoMapas[this.mapaSelecionado]['poligonos'].length; i++ ) {
		codigoMunicipio = this.coleçãoMapas[this.mapaSelecionado]['poligonos'][i]['codigoMunicipio'];
		valor = Math.round(this.coleçãoMapas[this.mapaSelecionado]['dados'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']][codigoMunicipio]*pot)/pot;
		this.coleçãoMapas[this.mapaSelecionado]['poligonos'][i]['valor'] = "<strong>"+this.coleçãoMapas[this.mapaSelecionado]['títulosDaLegenda'][this.coleçãoMapas[this.mapaSelecionado]["variávelSelecionada"]]+":</strong> "+formataNumero(valor,this.coleçãoMapas[this.mapaSelecionado]['casasDecimais'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']]);
		var achou = false ;
		if( (minimo==-1 || valor>=minimo ) &&
			 (maximo==-1 || valor<=maximo ) ) {
			for( j=0; j<this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']; j++ ) {
				if( (valor>=this.coleçãoMapas[this.mapaSelecionado]['classes'][j]) && ((j==this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']-1 && valor<=this.coleçãoMapas[this.mapaSelecionado]['classes'][j+1]) || (valor<this.coleçãoMapas[this.mapaSelecionado]['classes'][j+1])) ) {
					this.coleçãoMapas[this.mapaSelecionado]['poligonos'][i].setOptions( { 
						fillColor: (this.coleçãoMapas[this.mapaSelecionado]['inversãoDoEsquemaDeCores']?this.cores[this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']-1][this.coleçãoMapas[this.mapaSelecionado]['esquemaDeCores']][this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']-1-j]:this.cores[this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']-1][this.coleçãoMapas[this.mapaSelecionado]['esquemaDeCores']][j]),
						fillOpacity: this.coleçãoMapas[this.mapaSelecionado]['opacidade']
						 } );
					achou = true;
				}
			}
		}
		if( !achou )
			this.coleçãoMapas[this.mapaSelecionado]['poligonos'][i].setOptions( { 
				fillColor: '#e0e0e0',
				fillOpacity: this.coleçãoMapas[this.mapaSelecionado]['opacidade']
				 } );
	}
	
	// Atualiza a legenda
	$('#caixaLegenda-'+this.mapaSelecionado).html(this.montaLegenda());
	
	// Atualiza a região no box do título
	var caixaTítulo = document.getElementById( 'caixaTítulo-'+this.mapaSelecionado );
	if( caixaTítulo != null ) {
		var sRegiao = this.estados[this.uf];
		if( this.coleçãoMapas[this.mapaSelecionado]['micro']!=null) {
			sRegiao = 'Microrregião: '+this.dadosMicros[this.coleçãoMapas[this.mapaSelecionado]['micro']][ this.rótulosMicros.indexOf( 'Nome Micro' ) ];
		}
		else if( this.coleçãoMapas[this.mapaSelecionado]['meso']!=null) {
			sRegiao = 'Mesorregião: '+this.dadosMesos[this.coleçãoMapas[this.mapaSelecionado]['meso']][ this.rótulosMesos.indexOf( 'Nome Meso' ) ];
		}

		var subtítulo = __gpmAutoRef.coleçãoMapas[__gpmAutoRef.mapaSelecionado]['subtítulo'];
		if( subtítulo != '' )
			subtítulo += '<br/>';

		caixaTítulo.innerHTML = '<p style="margin-bottom:1ex;line-height:1">'+this.coleçãoMapas[this.mapaSelecionado]['título']+'</span><br/><span style="font-size:80%;font-weight:normal" id="subtítulo">'+subtítulo+'</span><span style="font-size:80%;font-weight:normal" id="regiao">'+sRegiao+'</span></p>';
	}	
	
	// Chama a função de callback para atualização de dados na página
	if( this.coleçãoMapas[this.mapaSelecionado]['callback']!=null) { 
		var fn = this.coleçãoMapas[this.mapaSelecionado]['callback'];
		var dados = new Object();
		for( i in this.coleçãoMapas[this.mapaSelecionado]['dados'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']] )
			if( (this.coleçãoMapas[this.mapaSelecionado]['micro']==null || this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Micro' )]==this.coleçãoMapas[this.mapaSelecionado]['micro'] ) &&
				(this.coleçãoMapas[this.mapaSelecionado]['meso'] ==null || this.dadosMunicipios[i][this.rótulosMunicípios.indexOf( 'Código Meso' )] ==this.coleçãoMapas[this.mapaSelecionado]['meso'] ) )
				 dados[i] = this.coleçãoMapas[this.mapaSelecionado]['dados'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']][i]; 
		fn( dados, minimo, maximo );
	}	
}


// ---------------------------------------------------------------------------------------
// atualizaLegenda() - ROTINA INTERNA
// Atualiza a caixa de legenda
// Parâmetros - objeto que contém a legenda
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.montaLegenda = function() {

	var legenda = '<div class="gpmCaixaLegenda"><p>'+ this.coleçãoMapas[this.mapaSelecionado]['títulosDaLegenda'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']]+'</p>';
	for (i=0; i<this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']; i++ ) {
		legenda += '<div class="gpmRotuloLegenda"><span class="gpmCaixaCor" style="background-color:' +
			(this.coleçãoMapas[this.mapaSelecionado]['inversãoDoEsquemaDeCores']?
			this.cores[this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']-1][this.coleçãoMapas[this.mapaSelecionado]['esquemaDeCores']][this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']-1-i]:
			this.cores[this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']-1][this.coleçãoMapas[this.mapaSelecionado]['esquemaDeCores']][i]) +
			'"></span><span>'+
			formataNumero(this.coleçãoMapas[this.mapaSelecionado]['classes'][i],this.coleçãoMapas[this.mapaSelecionado]['casasDecimais'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']]) + 
			" a " + 
			formataNumero(this.coleçãoMapas[this.mapaSelecionado]['classes'][i+1]-(i==this.coleçãoMapas[this.mapaSelecionado]['qtdeClasses']-1?0:(1/Math.pow(10,this.coleçãoMapas[this.mapaSelecionado]['casasDecimais'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']]))),this.coleçãoMapas[this.mapaSelecionado]['casasDecimais'][this.coleçãoMapas[this.mapaSelecionado]['variávelSelecionada']])+
			'</span></div>';
	}
	legenda += "</div>";
	return legenda;
}


// ---------------------------------------------------------------------------------------
// ordenaTabela() - ROTINA INTERNA
// Altera a ordem da tabela de dados do mapa ativo (com a tabela sendo exibida)
// Parâmetros - número da coluna (desconsiderando colunas de cabeçalho) que será usada para a ordenação
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.ordenaTabela = function(ordem) { 
	if (ordem != this.ordemTabela) {
		this.dadosTabela.sort(function (a, b) {
			if( ordem==0 ) return a[0].localeCompare(b[0]);
			else return a[ordem] - b[ordem];
		});
		this.ordemTabela = ordem;
	}
	else 
	    {
		this.dadosTabela.sort(function (a, b) {
			if( ordem==0 ) return b[0].localeCompare(a[0]);
			else return b[ordem] - a[ordem];
		});
		this.ordemTabela = -1;
    }		
	var sTabela1 = '';
	for( i in this.dadosTabela ) {
		sTabela1 += '<tr>';
		for( j in this.dadosTabela[i] )
			sTabela1 += '<td'+(j>0?' style="text-align:right"':'')+'>'+(j==0?this.dadosTabela[i][j]:formataArredondado(this.dadosTabela[i][j],this.coleçãoMapas[this.mapaSelecionado]['casasDecimais'][j-1]))+'</td>';
		sTabela1 += '</tr>';
	}
	$('#gpmTabelaMapa tbody').html( sTabela1 );

}
		
// ---------------------------------------------------------------------------------------
// desenhaLinha() - ROTINA INTERNA
// Desenha as linhas de latitude e longitude no fundo do mapa, bem como seus rótulos
// Parâmetros - número do mapa em que as linhas serão desenhadas
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.desenhaLinhas = function(nm) {


	if( nm == null )
		nm = this.numero;  // mapa

	// Apaga as linhas e rótulos atuais (se existirem)		
	for( i in __gpmAutoRef.coleçãoMapas[nm]['linhasCoords'] ) 
		__gpmAutoRef.coleçãoMapas[nm]['linhasCoords'][i].setMap(null);
	for( i in __gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'] ) {
		__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][i].setOptions( {visible: false});
	}

	// Encerra se o tipo de mapa não for o correto
	if( __gpmAutoRef.coleçãoMapas[nm]['mapa'].getMapTypeId() != 'coordinate' )
		return;

	// Determina os limites do mapa
	lim = __gpmAutoRef.coleçãoMapas[nm]['mapa'].getBounds();
	var lat1 = Math.round(lim.getNorthEast().lat(),0)+1;
	var lat2 = Math.round(lim.getSouthWest().lat(),0)-1;
	var lng1 = Math.round(lim.getNorthEast().lng(),0)+1;
	var lng2 = Math.round(lim.getSouthWest().lng(),0)-1;
	var lat0 = lim.getNorthEast().lat();
	var lng0 = lim.getSouthWest().lng();

	// Desenha as linhas de latitude e longitude
	var passo = Math.round(Math.abs(lat2-lat1)/4,0);
	var k=0;
	for( i=lat1-1; i>lat2; i-=passo, k++ ) {
		__gpmAutoRef.coleçãoMapas[nm]['linhasCoords'][k] = new google.maps.Polyline( {
				path: [ new google.maps.LatLng( i, lng1 ), new google.maps.LatLng( i, lng2 ) ],
				strokeColor: '#AAAAAA',
				strokeOpacity: 1,
				strokeWeight: 1,
				zIndex: 1
			});
		__gpmAutoRef.coleçãoMapas[nm]['linhasCoords'][k].setMap(__gpmAutoRef.coleçãoMapas[nm]['mapa']);
	}
	for( i=lng1; i>lng2; i-=passo, k++ ) {
		__gpmAutoRef.coleçãoMapas[nm]['linhasCoords'][k] = new google.maps.Polyline( {
				path: [ new google.maps.LatLng( lat1, i ), new google.maps.LatLng( lat2, i ) ],
				strokeColor: '#AAAAAA',
				strokeOpacity: 1,
				strokeWeight: 1,
				zIndex: 1
			});
		__gpmAutoRef.coleçãoMapas[nm]['linhasCoords'][k].setMap(__gpmAutoRef.coleçãoMapas[nm]['mapa']);
	}

	// Desenha os rótulos das coordenadas
	for( i=lat1-1, k=0; i>lat2; i-=passo,k++ ) {
		if( k < __gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'].length ) {
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setOptions({
				  text: Math.abs(i)+"º"+(i<0?"S":"N"),
				  visible: true,
				  position: new google.maps.LatLng( i, lng0 )
			});
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'left', '3px' );
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'top', '2px' );
		}
		else {
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k] = new Label({
				  map: __gpmAutoRef.coleçãoMapas[nm]['mapa'],
				  text: Math.abs(i)+"º"+(i<0?"S":"N"),
				  visible: true,
				  position: new google.maps.LatLng( i, lng0 ),
				  zIndex: 2
			});
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'left', '3px' );
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'top', '0px' );
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'border', 'none' );
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'font-size', 'small' );
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'background-color', '#F7F7F7' );
		}
	}
	for( i=lng1; i>lng2; i-=passo,k++ ) {
		if( k < __gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'].length ) {
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setOptions({
				  text: Math.abs(i)+"º"+(i<0?"W":"E"),
				  visible: true,
				  position: new google.maps.LatLng( lat0, i )
			});
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'left', '3px' );
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'top', '2px' );
		}
		else {
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k] = new Label({
				  map: __gpmAutoRef.coleçãoMapas[nm]['mapa'],
				  text: Math.abs(i)+"º"+(i<0?"W":"E"),
				  visible: true,
				  position: new google.maps.LatLng( lat0, i ),
				  zIndex: 2
			});
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'left', '3px' );
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'top', '2px' );
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'border', 'none' );
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'font-size', 'small' );
			__gpmAutoRef.coleçãoMapas[nm]['rótulosCoords'][k].setStyle( 'background-color', '#F7F7F7' );
		}
	}
}				

// ---------------------------------------------------------------------------------------
// mostraJanelaInfo() - ROTINA INTERNA
// Apresenta a janela de diálogo no mapa
// Parâmetros - evento de interface (automático)
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.mostraJanelaInfo = function(event) {
	
	// Dados do município
	var contentString = '<div id="infoWindow" class="row" style="max-width:100%;margin:0;padding:0"><div class="small-12 large-12 columns"><h4 style="line-height:1.35"><a href="municipio.html?codigo='+this.codigoMunicipio+'">'+this.nomeMunicipio+'</a></h4>';
	contentString += '<p style="margin-top:0">Microrregião: <a href="javascript:__gpmAutoRef.alteraEscala('+this.map.numero+', { \'micro\': \''+this.codigoMicro+'\' })">'+this.nomeMicro+'</a><br/>';
	contentString += 'Mesorregião: <a href="javascript:__gpmAutoRef.alteraEscala('+this.map.numero+', { \'meso\': \''+this.codigoMeso+'\' })">'+this.nomeMeso+'</a><br/>';
	contentString += 'Estado: <a href="javascript:__gpmAutoRef.alteraEscala('+this.map.numero+', { } )">Minas Gerais</a></p>';
	contentString += '<p>'+this.valor+'</p>';
	contentString += '</div></div>';
	
	// Atualiza a janela de diálogo
	__gpmAutoRef.infoWindow.setContent(contentString);
	__gpmAutoRef.infoWindow.setPosition(event.latLng);
	__gpmAutoRef.infoWindow.open(__gpmAutoRef.coleçãoMapas[this.map.numero]['mapa']);
}

// ---------------------------------------------------------------------------------------
// mostraDica() - ROTINA INTERNA
// ocultaDica() - ROTINA INTERNA
// moveDica() - ROTINA INTERNA
// Apresentação, remoção e reposicionamento do label que contém o nome do município
// Parâmetros - evento de interface (automático)
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.mostraDica = function(event) {
	__gpmAutoRef.coleçãoMapas[this.map.numero]['dica'].setOptions( {
		visible: true, 
		text: this.nomeMunicipio,
		position: event.latLng
	 });
}
GeoPUCMinas.prototype.ocultaDica = function(event) {
	__gpmAutoRef.coleçãoMapas[this.map.numero]['dica'].setOptions( {
		visible: false
	 });
}
GeoPUCMinas.prototype.moveDica = function(event) {
	__gpmAutoRef.coleçãoMapas[this.map.numero]['dica'].setOptions( {
		position: event.latLng
	 });
//	mostraCoordenadas( event.latLng.lat(), event.latLng.lng() );
}

// ---------------------------------------------------------------------------------------
// centralizaMapa() - ROTINA INTERNA
// Rotina para centralizar os mapas - necessária para as coleções de mapas.
// Parâmetros - número do mapa a posicionar, latitude e longitude do centro
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.centralizaMapa = function( nm, lat, lng ) {
	this.coleçãoMapas[nm]['mapa'].setCenter(new google.maps.LatLng(lat, lng));
}

// ---------------------------------------------------------------------------------------
// reencaixaMapa() - ROTINA INTERNA
// Rotina para centralizar e ajustar a amplificação dos mapas
// Parâmetros - número do mapa a posicionar, latitude e longitude do centro
// ---------------------------------------------------------------------------------------
GeoPUCMinas.prototype.reencaixaMapa = function( elemento ) {
	var nm=0;
	for( var i in this.coleçãoMapas ) {
		if( elemento == this.coleçãoMapas[i]['elemento'] ) {
			nm=i;
			break;
		}
	}
	var limites = this.coleçãoMapas[nm]['limites'];
	var bounds = new google.maps.LatLngBounds(
		new google.maps.LatLng( limites.sul, limites.oeste ),
		new google.maps.LatLng( limites.norte, limites.leste )
	);
	this.coleçãoMapas[nm]['mapa'].fitBounds( bounds );
}


// --------------------------------------------------------------------------------------
// redimensiona() - ROTINA INTERNA
// A chamada ao evento 'resize' do Google Maps é necessária sempre que o DIV que comporta
// o mapa for redimensionado (por meio da propriedade resize da CSS3). Como ainda não é 
// disparado nenhum evento nos navegadores atuais (isso acontece apenas quando a janela
// é redimensionada), então é necessário a chamada periódica a esta função.
// --------------------------------------------------------------------------------------
GeoPUCMinas.prototype.redimensiona = function () {

	for( var i in __gpmAutoRef.coleçãoMapas ) {
		google.maps.event.trigger( document.getElementById(__gpmAutoRef.coleçãoMapas[i]['elemento']), 'resize' );
	}

	for( var i in __gpmAutoRef.coleçãoMapas ) {
		if( __gpmAutoRef.coleçãoMapas[i]['zoomAtual'] != __gpmAutoRef.coleçãoMapas[i]['mapa'].getZoom() ) {
		
			// Atualiza o controle do zoom atual
			__gpmAutoRef.coleçãoMapas[i]['zoomAtual'] = __gpmAutoRef.coleçãoMapas[i]['mapa'].getZoom();
			
			// Insere e atualiza o controle personalizado de escala
			var metrosPorPixel = 156543.03392 * Math.cos(__gpmAutoRef.coleçãoMapas[i]['mapa'].getCenter().lat() * Math.PI / 180) / Math.pow(2, __gpmAutoRef.coleçãoMapas[i]['mapa'].getZoom() );
			var distancia = Math.pow(10,Math.ceil(Math.log(50*metrosPorPixel)/Math.LN10));
			var qtdePixel = distancia/metrosPorPixel;
			var j = 0;
			while( qtdePixel > 100 ) {
				j++;
				qtdePixel = (distancia*(1-j/10))/metrosPorPixel;
			}
			distancia *= (1-j/10);
				
			document.getElementById( 'gpmEscala1-'+i ).style.width = (qtdePixel/4)+'px';
			document.getElementById( 'gpmEscala2-'+i ).style.width = (qtdePixel/4)+'px';
			document.getElementById( 'gpmEscala4-'+i ).style.width = (qtdePixel/2)+'px';
			document.getElementById( 'gpmEscalaDistancia-'+i ).innerHTML = 
				(distancia>=1000?formataNumero(distancia/1000,0)+' km':formataNumero(distancia,0)+' m');
		}
	}

}


// --------------------------------------------------------------------------------------
// CÓDIGO PARA CONSTRUÇÃO DE TIPO DE MAPA COM FUNDO BRANCO E TILES COM COORDENADAS GEOGRÁFICAS
// Fonte: https://developers.google.com/maps/documentation/javascript/maptypes?hl=pt-BR
// --------------------------------------------------------------------------------------

function CoordMapType( m ) {
	this.mapa = m;
}
CoordMapType.prototype.tileSize = new google.maps.Size(256,256);
CoordMapType.prototype.maxZoom = 19;
CoordMapType.prototype.getTile = function(coord, zoom, ownerDocument) {

	var div = ownerDocument.createElement('DIV');
	div.style.width = this.tileSize.width + 'px';
	div.style.height = this.tileSize.height + 'px';
	div.style.backgroundColor = '#F7F7F7';
	div.style.borderStyle = 'none';
	
	var numTiles = 1 << __gpmAutoRef.coleçãoMapas[this.mapa]['mapa'].getZoom();
	var projection = new MercatorProjection();
	var ll = projection.fromPointToLatLng( new google.maps.Point( (coord.x*256)/numTiles, (coord.y*256)/numTiles ) );

	var lat = gd2gm( Math.abs( ll.lat() ) );
	lat += (ll.lat()<0?'S':'N');
	
	var lng = gd2gm( Math.abs( ll.lng() ) );
	lng += (ll.lng()<0?'W':'E');
	
	return div;
};
CoordMapType.prototype.name = "Fundo vazio";
CoordMapType.prototype.alt = "Remover o mapa de fundo";
// var coordinateMapType = new CoordMapType();


// --------------------------------------------------------------------------------------
// CÓDIGO DE APOIO PARA CONVERSÃO ENTRE AS COORDENADAS DE TILES E COORDENADAS GEOGRÁFICAS
// Fonte: https://developers.google.com/maps/documentation/javascript/maptypes?hl=pt-BR
// --------------------------------------------------------------------------------------

// converte graus decimais para graus e minutos
function gd2gm( gd ) {
	var g = Math.floor( gd );
	var resto = gd - g;
	var m = Math.round( resto * 60 );
	return g+"&deg;"+m+"'";
}
	
// converte graus decimais para graus, minutos e segundos
function gd2gms( gd ) {
	var g = Math.floor( gd );
	var resto = gd - g;
	var m = Math.floor( resto * 60 );
	resto = resto*60 - m;
	var s = Math.floor( resto*60 );
	return g+"&deg;"+m+"'"+s+'"';
}
	


function bound(value, opt_min, opt_max) {
	if (opt_min != null) value = Math.max(value, opt_min);
	if (opt_max != null) value = Math.min(value, opt_max);
	return value;
}
	
function degreesToRadians(deg) {
	return deg * (Math.PI/180);
}
	
function radiansToDegrees(rad) {
	return rad / (Math.PI/180);
}
	
function MercatorProjection() {
	this.pixelOrigin_ = new google.maps.Point(256/2,256/2);
	this.pixelsPerLonDegree_ = 256/360;
	this.pixelsPerLonRadian_ = 256/(2*Math.PI);
}
	
MercatorProjection.prototype.fromLatLngToPoint = function(latLng, opt_point) {
	var me = this;
	var point = opt_point || new google.maps.Point(0, 0);
	var origin = me.pixelOrigin_;
	
	point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;
	
	// NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
	// 89.189.  This is about a third of a tile past the edge of the world
	// tile.
	var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999,	0.9999);
	point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_;
	return point;
};
	
MercatorProjection.prototype.fromPointToLatLng = function(point) {
	var me = this;
	var origin = me.pixelOrigin_;
	var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
	var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
	var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
	return new google.maps.LatLng(lat, lng);
};
	
// --------------------------------------------------------------------------------------




// Formata um número ---------------------------------------------------------------------
function formataNumero(nStr,nDec)
{
	if( isNaN( nStr ) )
		return "---";
	nStr = nStr.toFixed(nDec)+'';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? ',' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + '.' + '$2');
	}
	return x1 + x2;
}


// Formata um número (já numérico) e o arredonda -----------------------------------------
function formataArredondado(nStr,nDec)
{
	if( isNaN( nStr ) )
		return "---";
	nStr = nStr.toFixed(nDec)+'';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? ',' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + '.' + '$2');
	}
	return x1 + x2;
}

// Obtem o valor de uma variável passada na URL ------------------------------------------
var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    	// If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
    	// If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
    	// If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
}();


function getNumClasses( dataList ) {
	// Sturges formula
	var nClasses = 1 + Math.round( 3.3 * ( Math.log( dataList.length ) / Math.LN10 ) );

	// Google Fusion Tables restricts to a maximum of 5 classes
	return Math.min( nClasses, 5 );
}

//This is used to get the actual breaks needed:
//Rotina original: http://danieljlewis.org/files/2010/06/Jenks.pdf
//Adaptação para JS: http://kgs.uky.edu/kgsmap/includes_jsAPI/jenks.js
// Citado por https://github.com/simogeo/geostats/pull/6
function getJenksBreaks(dataList, numClass, decimals){

	//sort the data list from small to large
	dataList.sort(sortNumber);
	
	//now iterate through the datalist:
	//determine mat1 and mat2
	//really not sure how these 2 different arrays are set - the code for each seems the same!
	//but the effect are 2 different arrays: mat1 and mat2
	var mat1 = [];
	for(var x=0,xl=dataList.length+1;x<xl;x++){
		var temp = []
		for(var j=0,jl=numClass+1;j<jl;j++){
			temp.push(0);
		}
		mat1.push(temp);
	}

	var mat2 = [];
	for(var i=0,il=dataList.length+1;i<il;i++){
		var temp2 = [];
		for(var c=0,cl=numClass+1;c<cl;c++){
			temp2.push(0);
		}
		mat2.push(temp2);
	}
	
	//absolutely no idea what this does - best I can tell, it sets the 1st group in the 
	//mat1 and mat2 arrays to 1 and 0 respectively
	for(var y=1,yl=numClass+1;y<yl;y++){
		mat1[0][y] = 1;
		mat2[0][y] = 0;
		for(var t=1,tl=dataList.length+1;t<tl;t++){
			mat2[t][y] = Infinity;
		}
		var v = 0.0;
	}
	
	//and this part - I'm a little clueless on - but it works
	//pretty sure it iterates across the entire dataset and compares each value to
	//one another to and adjust the indices until you meet the rules: minimum deviation 
	//within a class and maximum separation between classes
	for(var l=2,ll=dataList.length+1;l<ll;l++){
		var s1 = 0.0;
		var s2 = 0.0;
		var w = 0.0;
		for(var m=1,ml=l+1;m<ml;m++){
			var i3 = l - m + 1;
			var val = parseFloat(dataList[i3-1]);
			s2 += val * val;
			s1 += val;
			w += 1;
			v = s2 - (s1 * s1) / w;
			var i4 = i3 - 1;
			if(i4 != 0){
				for(var p=2,pl=numClass+1;p<pl;p++){
					if(mat2[l][p] >= (v + mat2[i4][p - 1])){
						mat1[l][p] = i3;
						mat2[l][p] = v + mat2[i4][p - 1];
					}
				}
			}
		}
		mat1[l][1] = 1;
		mat2[l][1] = v;
	}

	var k = dataList.length;
	var kclass = [];
  
	//fill the kclass (classification) array with zeros:
	for(i=0,il=numClass+1;i<il;i++){
		kclass.push(0);
	}

    //this is the last number in the array:
	kclass[numClass] = parseFloat(dataList[dataList.length - 1]);
	//this is the first number - can set to zero, but want to set to lowest to use for legend:
	kclass[0] = parseFloat(dataList[0]);
	var countNum = numClass;
	while(countNum >= 2){
		var id = parseInt((mat1[k][countNum]) - 2);
		kclass[countNum - 1] = dataList[id];
		k = parseInt((mat1[k][countNum] - 1));
		//spits out the rank and value of the break values:
		//console.log("id="+id,"rank = " + String(mat1[k][countNum]),"val = " + String(dataList[id]))
		//count down:
		countNum -= 1;
	}
			

	// Arredonda os valores			
	var pot = Math.pow( 10, decimals );
	for( i=0; i<kclass.length; i++ )
		kclass[i] = Math.round( kclass[i] * pot) / pot;
		
	//remove repetitions and zeros at the end
	for( i=kclass.length-1; i>0; i-- ) 
		if( kclass[i-1] >= kclass[i] )
			kclass.splice(i,1);

	return kclass; //array of breaks
}

//sorting function - ascending numbers:
function sortNumber(a,b){
	return a - b;
}


// --------------------------------------------------------------------------------------
// METODOS PARA DETERMINAÇÃO DAS CLASSES
// --------------------------------------------------------------------------------------


//This is used to get the actual breaks needed:
function getEqualBreaks(dataList, numClass, decimals){
	
	//sort the data list from small to large
	dataList.sort(sortNumber);

	//determine interval
	var interval = ( parseFloat(dataList[dataList.length-1]) - parseFloat(dataList[0]))/numClass;

	//determine the classes
	var pot = Math.pow( 10, decimals );
	var kclass = [];
	for( var i=0; i<numClass; i++ )
		kclass[i] = Math.round((parseFloat( dataList[0] ) + i*interval) * pot) / pot  ;

	kclass[i] = Math.round(parseFloat(dataList[dataList.length-1] ) * pot) / pot;

	//remove repetitions 
	i=0;
	while( i<kclass.length-1 ) {
		if( kclass[i] == kclass[i+1]) {
			kclass.splice(i+1,1);
			i=-1;
		}
		i++;
	}

	return kclass;	
}


//This is used to get the actual breaks needed:
function getQuantilesBreaks(dataList, numClass, decimals){
	
	//sort the data list from small to large
	dataList.sort(sortNumber);

	//determine interval
	var interval = dataList.length/numClass;

	//determine the classes
	var kclass = [];
	var pot = Math.pow( 10, decimals );
	j = 0;
	for( var i=0; i<numClass; i++ ) {
		j = Math.round( i*interval );
		kclass[i] = Math.round( parseFloat( dataList[j] ) * pot) / pot  ;
	}
	kclass[i] = Math.round(parseFloat(dataList[dataList.length-1] ) * pot) / pot;

	//remove repetitions 
	i=0;
	while( i<kclass.length-1 ) {
		if( kclass[i] == kclass[i+1]) {
			kclass.splice(i+1,1);
			i=-1;
		}
		i++;
	}

	return kclass;	
}


//This is used to get the actual breaks needed:
function getSDBreaks(dataList, numClass, decimals){
	
	//sort the data list from small to large
	dataList.sort(sortNumber);
	stats = average( dataList );
	log( JSON.stringify(stats,null,4) );
	
	var pot = Math.pow( 10, decimals );
	kclass = [];
	j = -(numClass/2-1);

	kclass[0] = Math.round(parseFloat(dataList[0] ) * pot) / pot;
	for( var i=1; i<numClass; i++ ) {
		kclass[i] = stats.mean+j*stats.deviation;
		j++
	}
	kclass[i] = Math.round(parseFloat(dataList[dataList.length-1] ) * pot) / pot;

	return kclass;
	
}


// Carlos R. L. Rodrigues
//@ http://jsfromhell.com/array/average [rev. #1]
average = function(a){

    var r = {mean: 0, variance: 0, deviation: 0}, t = a.length;
    for(var m, s = 0, l = t; l--; s += a[l]);
    for(m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
    return r.deviation = Math.sqrt(r.variance = s / t), r;
}



// --------------------------------------------------------------------------------------
// RÓTULOS PARA OS MUNICÍPIOS
//  http://blog.mridey.com/2011/05/label-overlay-example-for-google-maps.html
// --------------------------------------------------------------------------------------


// Define the overlay, derived from google.maps.OverlayView
function Label(opt_options) {
  // Initialization
  this.setValues(opt_options);

  // Label specific
  var span = this.span_ = document.createElement('span');
  span.style.cssText = 'position: relative; left: -100%; top: -16px; ' +
  'white-space: nowrap; border: thin solid black; font-size: x-small; font-family: sans-serif;' +
  'padding: 0px 2px; background-color: white; border-radius: 3px;';

  var div = this.div_ = document.createElement('div');
  div.appendChild(span);
  div.style.cssText = 'position: absolute; display: none';
};
Label.prototype = new google.maps.OverlayView;


// muda estilo
Label.prototype.setStyle = function( propriedade, estilo ) {
	if( propriedade == "font-size" )
		this.span_.style.fontSize = estilo;
	else if( propriedade == "font-family" )
		this.span_.style.fontFamily = estilo;
	else if( propriedade == "border" )
		this.span_.style.border = estilo;
	else if( propriedade == "left" )
		this.span_.style.left = estilo;
	else if( propriedade == "top" )
		this.span_.style.top = estilo;
	else if( propriedade == "background-color" )
		this.span_.style.backgroundColor = estilo;
}

// Implement onAdd
Label.prototype.onAdd = function() {
  var pane = this.getPanes().overlayImage;
  pane.appendChild(this.div_);

  // Ensures the label is redrawn if the text or position is changed.
  var me = this;
  this.listeners_ = [
    google.maps.event.addListener(this, 'position_changed', function() { me.draw(); }),
    google.maps.event.addListener(this, 'visible_changed', function() { me.draw(); }),
    google.maps.event.addListener(this, 'clickable_changed', function() { me.draw(); }),
    google.maps.event.addListener(this, 'text_changed', function() { me.draw(); }),
    google.maps.event.addListener(this, 'zindex_changed', function() { me.draw(); }),
    google.maps.event.addDomListener(this.div_, 'click', function() { 
      if (me.get('clickable')) {
        google.maps.event.trigger(me, 'click');
      }
    })
  ];
};


// Implement onRemove
Label.prototype.onRemove = function() {

	  this.div_.parentNode.removeChild(this.div_);

  // Label is removed from the map, stop updating its position/text.
	  for (var i = 0, I = this.listeners_.length; i < I; ++i) {
		google.maps.event.removeListener(this.listeners_[i]);
	  }
};


// Implement draw
Label.prototype.draw = function() {
  var projection = this.getProjection();
  var position = projection.fromLatLngToDivPixel(this.get('position'));

  var div = this.div_;
  div.style.left = position.x + 'px';
  div.style.top = position.y + 'px';

  var visible = this.get('visible');
  div.style.display = visible ? 'block' : 'none';

  var clickable = this.get('clickable');
  this.span_.style.cursor = clickable ? 'pointer' : '';

  var zIndex = this.get('zIndex');
  div.style.zIndex = zIndex;

  this.span_.innerHTML = this.get('text').toString();
};



/**
* easyModal.js v1.3.1
* A minimal jQuery modal that works with your CSS.
* Author: Flavius Matis - http://flaviusmatis.github.com/
* URL: https://github.com/flaviusmatis/easyModal.js
*/

/*jslint browser: true*/
/*global jQuery*/

(function ($) {
    "use strict";
    var methods = {
        init: function (options) {

            var defaults = {
                top: 'auto',
                autoOpen: false,
                overlayOpacity: 0.5,
                overlayColor: '#000',
                overlayClose: true,
                overlayParent: 'body',
                closeOnEscape: true,
                closeButtonClass: '.close',
                onOpen: false,
                onClose: false,
                zIndex: function () {
                    return (function (value) {
                        return value === -Infinity ? 0 : value + 1;
                    }(Math.max.apply(Math, $.makeArray($('*').map(function () {
                        return $(this).css('z-index');
                    }).filter(function () {
                        return $.isNumeric(this);
                    }).map(function () {
                        return parseInt(this, 10);
                    })))));
                },
                updateZIndexOnOpen: true
            };

            options = $.extend(defaults, options);

            return this.each(function () {

                var o = options,
                    $overlay = $('<div class="lean-overlay"></div>'),
                    $modal = $(this);

                $overlay.css({
                    'display': 'none',
                    'position': 'fixed',
                    // When updateZIndexOnOpen is set to true, we avoid computing the z-index on initialization,
                    // because the value would be replaced when opening the modal.
                    'z-index': (o.updateZIndexOnOpen ? 0 : o.zIndex()),
                    'top': 0,
                    'left': 0,
                    'height': '100%',
                    'width': '100%',
                    'background': o.overlayColor,
                    'opacity': o.overlayOpacity,
                    'overflow': 'auto'
                }).appendTo(o.overlayParent);

                $modal.css({
                    'display': 'none',
                    'position' : 'fixed',
                    // When updateZIndexOnOpen is set to true, we avoid computing the z-index on initialization,
                    // because the value would be replaced when opening the modal.
                    'z-index': (o.updateZIndexOnOpen ? 0 : o.zIndex() + 1),
                    'left' : 50 + '%',
                    'top' : parseInt(o.top, 10) > -1 ? o.top + 'px' : 50 + '%'
                    //,'height': 100+'%'
                });

                $modal.bind('openModal', function () {
                    var overlayZ = o.updateZIndexOnOpen ? o.zIndex() : parseInt($overlay.css('z-index'), 10),
                        modalZ = overlayZ + 1;

                    $modal.css({
                        'display' : 'block',
                        'margin-left' : -($modal.outerWidth() / 2) + 'px',
                        'margin-top' : (parseInt(o.top, 10) > -1 ? 0 : -($modal.outerHeight() / 2)) + 'px',
                        'z-index': modalZ,
                        'max-height': $('body').height()-100, // forcei uma margem de 50+50px para quando houver estouro
                        'overflow': 'scroll'
                    });
                    $overlay.css({'z-index': overlayZ, 'display': 'block'});

                    if (o.onOpen && typeof o.onOpen === 'function') {
                        // onOpen callback receives as argument the modal window
                        o.onOpen($modal[0]);
                    }
                });

                $modal.bind('closeModal', function () {
                    $modal.css('display', 'none');
                    $overlay.css('display', 'none');
                    if (o.onClose && typeof o.onClose === 'function') {
                        // onClose callback receives as argument the modal window
                        o.onClose($modal[0]);
                    }
                });

                // Close on overlay click
                $overlay.click(function () {
                    if (o.overlayClose) {
                        $modal.trigger('closeModal');
                    }
                });

                $(document).keydown(function (e) {
                    // ESCAPE key pressed
                    if (o.closeOnEscape && e.keyCode === 27) {
                        $modal.trigger('closeModal');
                    }
                });

                // Close when button pressed
                $modal.on('click', o.closeButtonClass, function (e) {
                    $modal.trigger('closeModal');
                    e.preventDefault();
                });

                // Automatically open modal if option set
                if (o.autoOpen) {
                    $modal.trigger('openModal');
                }

            });

        }
    };

    $.fn.easyModal = function (method) {

        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }

        if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        }

        $.error('Method ' + method + ' does not exist on jQuery.easyModal');

    };

}(jQuery));
