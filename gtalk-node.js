//nodeJS app to send gtalk-xmpp messages timed
var cronJob = require('cron').CronJob;
var xmpp = require('simple-xmpp');
var config = require('./config.json');

var execHour = 17;
var execMinute = 59;
var intervalMinute = 30;
var sendTo = '';
var sendToConfirm = '';
var confirm_msgs = [''];
var msg_notification = '';


//copys the config to local variables
function loadConfig () {
	execHour = config.intervals.startHour;
	execMinute = config.intervals.startMinute;
	intervalMinute = config.intervals.interval;
	sendTo = config.users.sendTo;
	sendToConfirm = config.users.sendToConfirm;
	confirm_msgs = config.messages.confirmation;
	msg_notification = config.messages.notification;
};


var execTime = '0 '+execMinute+' '+execHour+' * * *';
var intervalTime = '0 */'+intervalMinute+' * * * *';

var startDay = 71; //12.March
var todayJob = null;

var cronOpts = {cronTime: execTime,
				onTick: startToday,
				start:true};


function checkDay() {
	var currDay = getDayOfYear();
	var pillDay = currDay - startDay;
	if( (pillDay % 28) < 21  ) {
		return true;
	} else {
		return false;
	}
};

function getRandomConfirmMsg() {
	return confirm_msgs[Math.floor(Math.random() * (confirm_msgs.length))];
};

function startToday () {
	if(checkDay() && todayJob === null) {
		todayJob = new cronJob({cronTime: intervalTime, onTick: sendNotifier, start: true});
		xmpp.send(sendToConfirm, 'notification started on '+new Date());
	}
};

function sendNotifier () {
	log('sending..');
	xmpp.send(sendTo,msg_notification);
};

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
					xmpp.send(sendToConfirm, 'confirmed on: '+new Date());
				}
			break;
			case 'hilfe':
				xmpp.send(from, '====Hilfe====\n'
				+'\'hilfe\':\t dies.\n'
				+'\'ok\':\t Pilleneinnahme ist erfolgt.\n'
				+'\'status\':\t der aktuelle Status zur Pilleneinahme.\n'
				+'\'config\': startzeit und intervalle konfigurieren.');
			break;
			case 'status':
				if(checkDay()){ // pille muss genommen werden
					if((new Date).getHours <= execHour && (new Date).getMinutes <= execMinute){
						if(todayJob === null ){ // pille ist noch nicht genommen worden
							xmpp.send(from, 'Pille ist genommen worden.');
						} else {
							xmpp.send(from, 'Pille wurde noch nicht genommen, Benachrichtigung gestartet');
						}
					} else {
						xmpp.send(from, 'Pille wurde noch nicht genommen, Benachrichtigung nicht gestartet.');
					}
				} else {// pille muss nicht genommen werden
					xmpp.send(from, 'heute muss keine Pille genommen werden');
				}
			break;
			default:
				if(message.indexOf('config') === 0){
					var msg_split = message.trim().split(" ");
					if(msg_split.length === 2 && msg_split[1] === 'status'){ //print start and interval to user
						xmpp.send(from,'Notification starts: '+execHour+':'+execMinute+'\n'
								  +'Interval: '+intervalMinute);
					}else if ( msg_split.length === 3 ) {
					
					} else {
						xmpp.send(from, '====Config Hilfe====\n'
						+'\'config\':\t dies.\n'
						+'\'config status\':\t Ausgabe von Startzeit und Interval.\n'
						+'\'config start HH:MM\':\t Verstellt den Start auf das naechste HH:MM\n'
						+'\'status interval MM\':\t  Verstellt die Anzahl an Minuten zwischen den Nachfragen.');
					}
				} else {
					xmpp.send(from, '\'hilfe\' zeigt die Hilfe an.');
				}
			break;
		}
	
	}
});


/*util funcs*/
function getDayOfYear () {
	var today = new Date();
	var first = new Date(today.getFullYear(), 0, 1);
	var theDay = Math.round(((today - first) / 1000 / 60 / 60 / 24) + .5, 0);
	return theDay;
};

function connect () {
	log('connecting..');
	xmpp.connect({
	    jid         : config.xmpp.user,
	    password    : config.xmpp.password,
	    host        : 'talk.google.com',
	    port        : 5222
	});
};

function log (str) {
	var now = new Date();
	function pad(n){return n<10 ? '0'+n : n};
	console.log('['+pad(now.getDate())+'-'+pad(now.getMonth()+1)+'-'+now.getFullYear()+' '+pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds())+':'+now.getMilliseconds()+']: '+str);
};


loadConfig();
connect();
