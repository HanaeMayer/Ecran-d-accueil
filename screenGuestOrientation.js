var ecranEnLecture= new Object();
var refresh=false;

function setIdentification(log, pass){
	ecranEnLecture.login=log;
	ecranEnLecture.password=pass;
	}

function getTime(){
	var myDate = new Date(); 
	var hour = myDate.getHours(); 
	var minute = myDate.getMinutes(); 
	var theTime;
	 
	if (hour < 10) { hour = "0" + hour; } 
	if (minute < 10) { minute = "0" + minute; } 
	
	theTime = "" + hour + ":" + minute;
	
	return theTime;
}

function getDMY() {
	var months = ["Janvier", "Février", "Mars", 
"Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", 
"Octobre", "Novembre", "Décembre"];
	var myDate = new Date();
	var day = myDate.getDate(); 
	var month = months[myDate.getMonth()]; 
	var year = myDate.getFullYear(); 
	
	theDate = "" + day + "/" + month + "/" + year;
	
	return theDate;
}
  
function showDate(){
	var d;
	var date=[];
	d = getDMY()
	date = d.split("/");
	var theDate = 'Réunions du <span class="date">' + date[0] +" "+ date[1] +" "+ date[2] +'</span>';
	document.getElementById('title').innerHTML=theDate;
	setTimeout("showDate();",60000);
}

function showTime(){
	var t;
	t = getTime();
	document.getElementById('hourPanel').innerHTML=t;
	setTimeout("showTime();",1000);
}
  
function addTime(time1, time2) {
	var t1=time1.split(":");
	var t2=time2.split(":");
	var t3=[];
	var time3="";
	t3[0]=parseInt(t1[0], 10)+parseInt(t2[0], 10);
	t3[1]=parseInt(t1[1], 10)+parseInt(t2[1], 10);
	time3=t3[0]+":"+t3[1];
	return time3;
}
		  
function compareTime(time, ref) {
	var r=ref.split(":");
	var t=time.split(":");
	if (parseInt(t[0],10)>parseInt(r[0],10)) return true;
	else if ((parseInt(t[0],10)==parseInt(r[0],10))&&(parseInt(t[1],10)>=parseInt(r[1],10))) return true;
	else return false;
	
}
		  
function intervalleOfTime(time, ref) {// dit si l'heure de début d'une résa est dans max 3 heures
	var r = ref.split(":"); 
	var t=time.split(":");
	if ((parseInt(t[0],10)-parseInt(r[0],10))<=2) 
		return true;
	else
		return false;
}

function setDateOnUrbaFormat(d){
// transforme une date d au format URBA: aaaa-mm-ddT00:00:00-->format JSON
	var m= d.getMonth()+1;
	m="0"+m;
	return d.getFullYear()+"-"+m+"-"+d.getDate()+"T00:00:00";
}

function getTimeFromUrbaFormat(date){// extrait l'heure dans une date au format URBA
	var t= date.split("T");
	var hhmm= t[1].split(":");
	return ""+hhmm[0]+":"+hhmm[1]; // l'heure au format hh:mm
}

function initDocument(){
	var i=0;
	var w=$(window).width();
	var h=$(window).height();
	$("#hourPanel").css("font-size",((w*h/1000000)+2)+"em");
	$(".tableau").css("font-size",((w*h/1000000)+1)+"em");
	$("#title").css("font-size",((w*h/1000000)+1)+"em");
	$(window).resize(function(){
		var w=$(window).width();
		var h=$(window).height();
		$("#hourPanel").css("font-size",((w*h/1000000)+2)+"em");
		$(".tableau").css("font-size",((w*h/1000000)+1)+"em");
		$("#title").css("font-size",((w*h/1000000)+1)+"em");
	});
	
	getUrbaToken();
}

function refreshScreen(){
	try{
	if (!refresh) {
		getUrbaToken();
		refresh=true;
	}
	}
	catch(e){
	console.log(e);
	getUrbaToken();
	}
}

 function getUrbaToken(){
 try{
 $.ajax({
		url : 'http://demo.urbaonline.com/pjeecran/authentication/getToken?login='+ecranEnLecture.login+'&password='+ecranEnLecture.password,
		dataType : 'jsonp',
		jsonpCallback: 'setValidToken',			
	})
	}
	catch(e){
	console.log(e);
	getUrbaToken();
	}	
}

function setValidToken(newToken){
	try { 
	ecranEnLecture.validToken= newToken.Token;
	}
	catch(e){
	console.log(e);
	getUrbaToken();
	}
	getUrbaJson();
}

function createStartDate() {
	var today= new Date();
	startDate=today.getFullYear()+"-"+(today.getMonth()+1)+"-"+today.getDate()+"T00:00:00";
	return startDate;
}

function createEndDate() {
	var today= new Date();
	endDate=today.getFullYear()+"-"+(today.getMonth()+1)+"-"+today.getDate()+"T23:59:59";
	return endDate;
}

function getUrbaJson(){
	try{
	var startDate=createStartDate();
	var endDate=createEndDate();
	$.ajax({
			url : 'http://demo.urbaonline.com/pjeecran/api/v1/bookings?StartDate='+startDate+"&endDate="+endDate+'&Token='+ecranEnLecture.validToken,
			dataType : 'jsonp',
			jsonpCallback: 'fillNewJson',		
		})
		}
	catch(e){
	console.log(e);
	getUrbaJson();
	}
}
	
function fillNewJson(objJson){
	try {
		var j=0;
		var newJson = [];
		var stH="";
		var endH="";
		var begun;
		var now=getTime();
		$.each(objJson, function(key, value) {
			stH=getTimeFromUrbaFormat(value.startDate);
			endH=getTimeFromUrbaFormat(value.endDate);
			if (compareTime(endH,now) && intervalleOfTime(stH,now)) {// formation d'un nouveau JSON
				newJson[j] = {"heuresDeResa": stH, "organisateurs": value.fields[0].value, "salles": value.resource.displayName};
				j=j+1;
			}
		});
	}

	catch(e){
	console.log(e);
	getUrbaJson();
	}
	sortNewJson(newJson,"heuresDeResa");
}

function sortNewJson(jsonToSort, prop) {
    jsonToSort = jsonToSort.sort(function(a, b) {
        var A=a[prop].split(":");
		var B=b[prop].split(":");
		var x="";
		var y="";
		x=A[0]+""+A[1];
		y=B[0]+""+B[1];
		return parseInt(x, 10)-parseInt(y, 10);
    });
	displayNewJson(jsonToSort);
}

function displayNewJson(SortedJson){
	var ligne=0;
	var items = [];
	ecranEnLecture.nbDisplayedRooms=8;
	var today= new Date();
	now=getTime();
	$('.refresh').remove();
	$('#entete').show();
	$.each(SortedJson, function(key, value) {
		if (ligne%2==0) p=1;
		if (ligne%2==1) p=2;
		var h=(SortedJson[ligne].heuresDeResa).split(":");
		items.push('<td class="heure">'+h[0]+"h"+h[1]+'</td>');
		items.push('<td class="organisateur">'+SortedJson[ligne].organisateurs+'</td>');                           
		items.push('<td class="salle">'+SortedJson[ligne].salles+'</td>');
		if (!compareTime(SortedJson[ligne].heuresDeResa,now)) items.push('<td class="debut">en cours</td>');
		else items.push('<td class="debut"></td>');		
		$('<tr>', {
		   'class': 'ligne'+p+' refresh',
		   'id': ligne,
		   html: items.join('')
		   }).appendTo('table');
		   items.length = 0;
		   ligne++;
		});
	
	refresh=false;
	
	if (ligne==0) {
		$('#entete').hide();
		items.push('<td colspan="4" class="noRes">Aucune réservation prévue pour l\'instant</td>');
		ligne=1;		
		$('<tr>', {
		   'class': 'ligne1 refresh',
		   html: items.join('')
		   }).appendTo('table');
		   items.length = 0;
		   setTimeout("refreshScreen();", 300000)
	}

	if (ligne<=ecranEnLecture.nbDisplayedRooms){
		for (i=ligne; i<ecranEnLecture.nbDisplayedRooms; i++) {
		items.push('<td colspan="4">&nbsp;</td>');
		$('<tr>', {
		   'class': 'ligne1 refresh',
		   html: items.join('')
		   }).appendTo('table');
		   items.length = 0;
		}
		setTimeout("refreshScreen();", 300000);
	}
	else if(ligne>ecranEnLecture.nbDisplayedRooms){
		var nbCycles=Math.round(150/(5*(ligne-ecranEnLecture.nbDisplayedRooms)));
		showFirstHideNext(ligne, nbCycles);
	}
}

function showFirstHideNext(nbLine, nbCycles) {
		var nbLigneSup=0;
		var l=nbLine;
		var c=nbCycles;
		
		alert('test');
		
		$.fn.animateHighlight = function(highlightColor, duration) {
			var highlightBg = highlightColor || "#FFFF9C";
			var animateMs = duration || 1500;
			var originalBg = this.css("backgroundColor");
			this.stop().css("background-color", highlightBg).animate({backgroundColor: originalBg}, animateMs);
		};
		
		if (c>0) {
			for (i=0;i<(nbLine);i++){
				if(i<ecranEnLecture.nbDisplayedRooms) {
					$('#'+i).show(); 
					$('#'+i).animateHighlight('#5e8894',1000);
					}
				else {$('#'+i).hide();nbLigneSup++;}
			}
			c--;
			hideFirstShowNext(nbLigneSup, l, c);
		}
		else refreshScreen()
}

function hideFirstShowNext(nbHiddenLine, nbLine, nbCycles) {
	var i=0;
	var l=nbLine;
	var nbPage=Math.ceil(nbHiddenLine/ecranEnLecture.nbDisplayedRooms);
	var c=nbCycles;
	
	$.fn.animateHighlight = function(highlightColor, duration) {
		var highlightBg = highlightColor || "#FFFF9C";
		var animateMs = duration || 1500;
		var originalBg = this.css("backgroundColor");
		this.stop().css("background-color", highlightBg).animate({backgroundColor: originalBg}, animateMs);
	};
	
	var interval = setInterval(function(){
		if (nbPage>1){
			for (i=0;i<ecranEnLecture.nbDisplayedRooms;i++){
				$('#'+i).hide(300);
				$('#'+(i+ecranEnLecture.nbDisplayedRooms)).show(0);
				$('#'+(i+ecranEnLecture.nbDisplayedRooms)).animateHighlight('#ffa500',1000);
			}
			nbPage--;
		}
		else if (nbPage=1){
			var lignesRestantes=nbHiddenLine%ecranEnLecture.nbDisplayedRooms;
			for (i=0;i<ecranEnLecture.nbDisplayedRooms;i++){
				$('#'+i).hide(300);
			}
			for (i=0;i<lignesRestantes;i++) {
				$('#'+(i+ecranEnLecture.nbDisplayedRooms)).show(0);
				$('#'+(i+ecranEnLecture.nbDisplayedRooms)).animateHighlight('#ffa500',1000);
			}
			alert(nbPage);
			nbPage--;
		}
		else if (nbPage=0){
			alert(nbPage);
			showFirstHideNext(l, c);
			clearInterval(interval);
		}
	}, 3000);
}