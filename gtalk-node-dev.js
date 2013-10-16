//nodeJS app to send gtalk-xmpp messages timed
"use strict";

var fs = require('fs');
var cronJob = require('cron').CronJob;
var xmpp = require('simple-xmpp');
var config = require('./config.json');

var web = require('./web.js');

var execHour = null;
var execMinute = null;
var intervalMinute = null;
var sendTo = null;
var sendToConfirm = null;
var confirm_msgs = null;
var msg_notification = null;
var todayJob = null;

var execTime = null;
var intervalTime = null;

var startDay = 71; //12.March

var cronOpts = null;

loadConfig();

//copys the config to local variables
function loadConfig () {
	execHour = config.intervals.startHour;
	execMinute = config.intervals.startMinute;
	intervalMinute = config.intervals.interval;
	sendTo = config.users.sendTo;
	sendToConfirm = config.users.sendToConfirm;
	confirm_msgs = config.messages.confirmation;
	msg_notification = config.messages.notification;
	
	execTime = '0 '+execMinute+' '+execHour+' * * *';
	intervalTime = '0 */'+intervalMinute+' * * * *';

	cronOpts = {cronTime: execTime,
					onTick: startToday,
					start:true};	
}


//------------
web.startWebInterface();
//----------------






function checkDay() {
	var currDay = getDayOfYear();
	var pillDay = currDay - startDay;
	if( (pillDay % 28) < 21  ) {
		return true;
	} else {
		return false;
	}
}

function getRandomConfirmMsg() {
	return confirm_msgs[Math.floor(Math.random() * (confirm_msgs.length))];
}

function startToday () {
	if(checkDay() && todayJob === null) {
		sendNotifier();
		todayJob = new cronJob({cronTime: intervalTime, onTick: sendNotifier, start: true});
		xmpp.send(sendToConfirm, 'notification started on '+getNow());
	}
}

function sendNotifier () {
	log('sending..');
	xmpp.send(sendTo,msg_notification);
}

xmpp.on('online', function () {
	log('online');
	var job = new cronJob(cronOpts);
});

xmpp.on('chat', function(from, message) {
	log('msg from: '+from+' message: '+message);
	if(from === sendTo || from === sendToConfirm) {
		//hilfe, ok und status
		switch (message.toLowerCase()){
			case 'ok':
				if(todayJob !== null){
					todayJob.stop();
					todayJob = null;
					xmpp.send(from, getRandomConfirmMsg());
					xmpp.send(sendToConfirm, 'confirmed on: '+getNow());
				}
			break;
			case 'hilfe':
				xmpp.send(from, '====Hilfe====\n'+
				'\'hilfe\':\t dies.\n'+
				'\'ok\':\t Pilleneinnahme ist erfolgt.\n'+
				'\'status\':\t der aktuelle Status zur Pilleneinahme.\n'+
				'\'config\': startzeit und intervalle konfigurieren.');
			break;
			case 'status':
				if(checkDay()){ // pille muss genommen werden
					var startString = execHour+':'+execMinute;
					if((new Date()).getHours <= execHour && (new Date()).getMinutes <= execMinute){
						if(todayJob === null ){ // pille ist noch nicht genommen worden
							xmpp.send(from, 'Pille ist genommen worden. '+startString);
						} else {
							xmpp.send(from, 'Pille wurde noch nicht genommen, Benachrichtigung gestartet '+startString);
						}
					} else {
						xmpp.send(from, 'Pille wurde noch nicht genommen, Benachrichtigung nicht gestartet. '+startString);
					}
				} else {// pille muss nicht genommen werden
					xmpp.send(from, 'heute muss keine Pille genommen werden');
				}
			break;
			default:
				xmpp.send(from, '\'hilfe\' zeigt die Hilfe an.');
		}
	
	}
});

xmpp.on('error',function (err) {
	console.log(err);
});


/*util funcs*/
function saveConfig () {
	fs.writeFile("config.json",JSON.stringify(config, undefined, 2), function(err) {
		if(err) {
			console.log(err);
		} else {
			loadConfig();
		}
	});
}

function getDayOfYear () {
	var today = new Date();
	var first = new Date(today.getFullYear(), 0, 1);
	var theDay = Math.round(((today - first) / 1000 / 60 / 60 / 24) + 0.5, 0);
	return theDay;
}

function connect () {
	log('connecting..');
	xmpp.connect({
		jid			: config.xmpp.user,
		password	: config.xmpp.password,
		host		: 'talk.google.com',
		port		: 5222
	});
}

function log (str) {
	console.log(getNow()+': '+str);
}

function getNow () {
	var now = new Date(),
	pad = function (n) {return n<10 ? '0'+n : n;};
	return '['+pad(now.getDate())+'-'+pad(now.getMonth()+1)+'-'+now.getFullYear()+' '+pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds())+':'+now.getMilliseconds()+']';
}


connect();
