var exec = require('child_process').execSync;
var spawn = require('child_process').spawn;
var fs = require('fs');
var url = require('url');
var parseString = require('xml2js').parseString;
var dateFormat = require('dateformat');

function Log(LEVEL,TAG,FILE,MSG) {
	var now = new Date();
	var newdate = dateFormat(now, "dd-mm-yyyy-h:MM:ss");
	
	var logmsg = newdate+" ["+TAG+"] "+MSG;
	
	logmsg = logmsg.replace(/(?:\r\n|\r|\n)/g, '');
	
	console.log(logmsg);
	fs.appendFileSync(FILE, logmsg+'\n');
	
	return true;
}

var LOGFILE = "/var/log/NodeUI.log";

exports.Pages = function(app) {
	
	app.set('view engine', 'ejs');
	app.set('views', '/var/www/fdr/EJS');
	app.disable('view cache');
	
	Log(1,"NodeUI",LOGFILE,"EJS done.");
	
	app.get('/load', function (req, res) {
		
		var page = req.query.page;
		
		if (page == "record") {
			
			Log(1,"NodeUI",LOGFILE,"Load '"+page+"' EJS page.");
			
			// Storages
			var allstorages = [];
			var cmdout = exec ("df -h | grep -e 0p4 -e 1p4 -e sd | awk '{print $6}'").toString().split('\n');
					
			for (var i in cmdout) {
				if (cmdout[i].length > 1) {
					//console.log("'"+cmdout[i]+"'");
					allstorages.push(cmdout[i]);
				}
			}
			
			// Read camera settings
			var camerasstr = fs.readFileSync('/etc/cameras.json', 'utf8');
			if (camerasstr.length > 10) {
				var camerasobj = JSON.parse(camerasstr);
			} else {
				var camerasobj = new Object();
				camerasobj["cameras"] = [];
				Log(1,"NodeUI",LOGFILE,"No camera configurations found");
			}
			
			// ... //
			
			// Detected on board Cameras
			var syscams = [];
			if (!fs.existsSync('/dev/video0')) {
				syscams["ERROR"] = "No cameras detected";
				Log(1,"NodeUI",LOGFILE,"No cameras detected");
			} else {
				var cmdout = exec("ls -1 /dev/video*").toString().split('\n');
			
				for (var i in cmdout) {
				
					var cameras = [];
					if (cmdout[i].length > 1) {
						cameras["device"] = cmdout[i];
				
						var sysfs = "/sys/class/video4linux/"+cmdout[i].replace("/dev/","")+"/name";
						if (fs.existsSync(sysfs)) {
							var drivername = fs.readFileSync("/sys/class/video4linux/"+cmdout[i].replace("/dev/","")+"/name").toString();
							if (drivername.trim() == "camera0")
								cameras["type"] = "CSI ["+drivername+"]";
							else
								cameras["type"] = "USB ["+drivername+"]";
						}
				
						syscams.push(cameras);
					}
				}
			}
			//console.log(syscams);
			
			res.render("Record",{cameras: camerasobj.cameras, syscameras: syscams, storages: allstorages, user: 'test'});
			
		} // end record page
		
		
	});
	
};

exports.Config = function(app) {
	
	app.get('/readNVRcams', function (req, res) {
		var NVRCONF = "/etc/nvr/oi_record.xml";
	
		var xmlbuf = fs.readFileSync(NVRCONF);
	
		parseString(xmlbuf, function (err, result) {
		
			var cameras = result.Config.Camera;
	
			/*cameras.forEach(function (camera) {
				console.log(camera.Name+" "+camera.CameraType+" "+camera.USB_Cam_Device+" "+camera.USB_Cam_Res+" "+camera.USB_Cam_FPS+" "+camera.Record);
			});*/

			res.send(cameras);
		});
	});
	
};
