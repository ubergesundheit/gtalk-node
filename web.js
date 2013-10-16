var express = require('express');
var app = express();
var config = require('./config.json');

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.bodyParser());
app.use(express.basicAuth('testUser', 'testPass'));

app.get('/', function(req, res) {
	res.render('config',{days: config.days});
});

app.post('/updateConfig', function(req, res) {	
	var input = req.body,
	newConf = config.days,
	inWeek = function (input) { //function to test if the property corresponds to a weekday
		for(var i = 0; i<config.days.length; i++){
				if(input.indexOf(config.days[i].name) !== -1){
					return true;
				}

		}
		return false;
	},
	correctday = function (input) { //function to get the correct day from the input
		for(var i = 0; i<newConf.length; i++){
			if(newConf[i].name === input){
				return newConf[i];
			}
		}
	},
	inRange = function (type,value) { //function to test if the value is a valid input for hour or minute
		switch(type){
			case 'hour':
				if(value>=0 && value <=23){
					return true;
				}
			break;
			case 'minute':
				if(value>=0 && value <=59){
					return true;
				}
			break;
		}
		return false;
	},
	validate = function (callback) {
		var valid = true;
		//validate the post
		//test if all properties of the old config are there
		loop:
		for (var key in input) {
			if (input.hasOwnProperty(key)) {
				if(inWeek(key)){//some day?
					if(!isNaN(parseInt(input[key],10))){//value parseable to int?
						var curr = key.split('_');
						if(inRange(curr[1],parseInt(input[key],10))){
							switch(curr[1]){
								case 'hour':
									correctday(curr[0]).startHour = parseInt(input[key],10);
									break;
								case 'minute':
									correctday(curr[0]).startMinute = parseInt(input[key],10);
									break;
								default:
									res.status(400).json({'error':'property '+key+' is not a valid identifier for either hour or minute'});
									valid = false;
									break loop;
							}
						} else {
							res.status(400).json({'error':'value of property '+key+' is not in the valid range'});
							valid = false;
							break loop;
						}
					}else{
						res.status(400).json({'error':'property '+key+' is not a number'});
						valid = false;
						break loop;
					}
				} else {
					res.status(400).json({'error':'invalid post body'});
					valid = false;
					break loop;
				}
			}
		}
		console.log(valid);
		if(valid){
			callback();
		}
	};
	validate(function () {
		config.days = newConf;
		saveConfig();
		res.json(config);
	});
});

function startWebInterface () {
	app.listen(8000);
}

exports.startWebInterface = startWebInterface;