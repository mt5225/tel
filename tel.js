//---------------------------------------------
// tel scene id: 20170902015219229693920
//---------------------------------------------

//global init settings
var LISTENING = false;
var T_Live_Fire_Alarm = {};
var T_Live_Gas_Alarm = {};
var CURRENT_LEVEL = 'world';
var BASE_URL = "http://192.168.86.24:9006/";
var T_Banner_List = {};
var T_Fly_List = {}

util.addEventListener("levelchange", function (event) {
	if (event.ClsID == ObjectFactory.CLSID_WORLD) {
		CURRENT_LEVEL = 'world';
	} else if (event.ClsID == ObjectFactory.CLSID_BUILDING) {
		CURRENT_LEVEL = 'building';
	} else if (event.ClsID == ObjectFactory.CLSID_FLOORPLAN) {
		CURRENT_LEVEL = 'floor';
	}
})

function get_floor_by_objname(obj_name) {
	if (string.contains(obj_name, '1F')) {
		return 1;
	}
	if (string.contains(obj_name, '2F')) {
		return 2;
	}
	if (string.contains(obj_name, '3F')) {
		return 3;
	}
	return 0;
}

//show banner on top of object
function show_banner(obj) {
	if (T_Banner_List[obj.getProperty("name")] == null) {
		util.download({
			"url": BASE_URL + "outline_button.bundle",
			"success": function (res) {
				var banner_ui = gui.create(res);
				var offsetY = obj.size.y + 0.2;
				banner_ui.setObject(obj, Vector3(0, offsetY, 0));
				var occr = string.split(obj.getProperty("occurance"), " ");
				var msg = "<size=12>" + occr[1] + "\n" + obj.getProperty("name") + "</size>";
				banner_ui.setText("Button/Text", msg);
				util.downloadTexture({
					"url": BASE_URL + "demo_panel_001.png",
					"success": function (text) {
						banner_ui.setImage("Button", text);
					}
				});
				//fly to object while user click the banner
				banner_ui.regButtonEvent("Button", function () {
					fly_to_object(obj);
				});
				T_Banner_List[obj.getProperty("name")] = banner_ui;
			}
		});
	}
}

//fly to object
function fly_to_object(obj) {
	var cam_pos = camera.getEyePos();
	if (Vector3.Distance(cam_pos, obj.center) > 50) {
		camera.flyTo({
			"eye": obj.center + Vector3(0.5, 0.5, 0.5),
			"target": obj.center,
			"time": 1,
			"complete": function () {
			}
		});
	}
}

//react to fire alarm level
function fly_to_fire_level(fireObj) {
	var building = world.buildingList.get_Item(0);
	if (CURRENT_LEVEL != 'floor') {
		util.setTimeout(function () {
			level.change(building);
			util.setTimeout(function () {
				var floor = building.planList.get_Item(get_floor_by_objname(fireObj.getProperty("name")));
				level.change(floor);
			}, 100);
		}, 100);
	} else {
		util.setTimeout(function () {
			var floor = building.planList.get_Item(get_floor_by_objname(fireObj.getProperty("name")));
			level.change(floor);
		}, 1200);
	}
}

//fly to gas level (first floor)
function fly_to_gas_level() {
	var building = world.buildingList.get_Item(0);
	if (CURRENT_LEVEL != 'floor') {
		util.setTimeout(function () {
			level.change(building);
			util.setTimeout(function () {
				var floor = building.planList.get_Item(1);
				level.change(floor);
			}, 100);
		}, 100);
	} else {
		util.setTimeout(function () {
			var floor = building.planList.get_Item(1);
			level.change(floor);
		}, 1000);
	}
}

function remove_all_gas_alarm() {
	foreach(var item in vpairs(table.keys(T_Live_Gas_Alarm))) {
		var obj = object.find(item);
		obj.setColorFlash(false);
		if (T_Banner_List[item] != null) {
			T_Banner_List[item].destroy();
			table.remove(T_Banner_List, item);
		}
		table.remove(T_Fly_List, item);
	}
}

function remove_recovery_gas_alarm(gasArray) {
	foreach(var item in vpairs(table.keys(T_Live_Gas_Alarm))) {
		var isAlarm = false;
		for (var i = 0; i < array.count(gasArray); i++) {
			var tmpArray = string.split(gasArray[i], "|");
			if (string.contains(tmpArray[0], item)) {
				isAlarm = true;
			}
		}
		if (isAlarm == false) {
			var obj = object.find(item);
			obj.setColorFlash(false);
			if (T_Banner_List[item] != null) {
				T_Banner_List[item].destroy();
				table.remove(T_Banner_List, item);
			}
			table.remove(T_Fly_List, item);
		}
	}
}

gui.createButton("Listen", Rect(40, 220, 60, 30), function () {
	if (LISTENING == false) {
		LISTENING = true;
		util.setInterval(function () {
			if (LISTENING) {
				util.download({
					"url": BASE_URL + "fire",
					"type": "text",
					"success": function (rs) {
						if (string.length(rs) > 10) {
							rs = string.trim(rs);
							var msgArray = string.split(rs, "#");
							for (var i = 0; i < array.count(msgArray); i++) {
								//split and save to live event table
								tmpArray = string.split(msgArray[i], "|");
								T_Live_Fire_Alarm[tmpArray[3]] = msgArray[i];
							}
							foreach(var item in vpairs(table.keys(T_Live_Fire_Alarm))) {
								if (string.contains(T_Live_Fire_Alarm[item], "fire")) {
									var fireObj = object.find(item);
									fireObj.addProperty("name", item);
									var t = string.split(T_Live_Fire_Alarm[item], "|");
									fireObj.addProperty("occurance", t[0]);
									fireObj.addProperty("name", item);
									fireObj.addProperty("tranfer", t[2]);
									util.setTimeout(function () {
										show_banner(fireObj);
										fireObj.setColorFlash(true, Color.red, 2.5);
									}, 1000);
									//check if have flied once
									if (table.containskey(T_Fly_List, fireObj.getProperty("name")) == false) {
										fly_to_fire_level(fireObj);
										T_Fly_List[fireObj.getProperty("name")] = fireObj;
									}
								} else {
									//handle recovery fire alarms
									table.remove(T_Live_Fire_Alarm, item);
									var fireObj = object.find(item);
									fireObj.setColorFlash(false);
								}
							}
						}

					},
					"error": function (t) {
						print(t);
					}
				});
				util.download({
					"url": BASE_URL + "gas",
					"type": "text",
					"success": function (rs) {
						if (string.length(rs) > 10) {
							rs = string.trim(rs);
							var gasArray = string.split(rs, "#");
							if (array.count(gasArray) > 0) {
								for (var i = 0; i < array.count(gasArray); i++) {
									var tmpArray = string.split(gasArray[i], "|");
									var gasObj = object.find(tmpArray[0]);
									gasObj.addProperty("occurance", tmpArray[1]);
									gasObj.addProperty("name", tmpArray[0]);
									util.setTimeout(function () {
										gasObj.setColorFlash(true, Color.red, 2.5);
										show_banner(gasObj);
										T_Live_Gas_Alarm[gasObj.getProperty("name")] = gasObj
									}, 1000);
									//check if have flied once
									if (table.containskey(T_Fly_List, gasObj.getProperty("name")) == false) {
										fly_to_gas_level();
										T_Fly_List[gasObj.getProperty("name")] = gasObj;
									}
								}
								remove_recovery_gas_alarm(gasArray);
							}
						} else {
							//no gas alarms, clear alarm array
							remove_all_gas_alarm();
						}
					},
					"error": function (t) {
						print(t);
					}
				});
			}
		}, 3000);
	}
});

gui.createButton("Reset", Rect(40, 260, 60, 30), function () {
	util.clearAllTimers();
	foreach(var item in vpairs(table.keys(T_Banner_List))) {
		if (T_Banner_List[item] != null) {
			T_Banner_List[item].destroy();
		}
	}
	camera.flyTo({
		"eye": Vector3(-80, 80, -50),
		"target": Vector3(3, 4, 5),
		"time": 1,
		"complete": function () {
			LISTENING = false;
			util.setTimeout(function () {
				CURRENT_LEVEL = 'world';
				level.change(world);
				table.clear(T_Banner_List);
				table.clear(T_Live_Fire_Alarm);
				table.clear(T_Fly_List);
			}, 500);
		}
	});
});
