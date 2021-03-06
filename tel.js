//---------------------------------------------
// tel scene id: 20170902015219229693920
//---------------------------------------------

//global init settings
var LISTENING = false;
var T_Live_Fire_Alarm = {};
var T_Live_Gas_Alarm = {};
var CURRENT_LEVEL = 'world';
var BASE_URL = "http://192.168.0.250:9006/";
//var BASE_URL = "http://192.168.86.24:9006/";
var T_Banner_List = {};
var T_Fly_List = {};
var T_Fire_List = {};
var T_Gas_List = {};
var SHOW_GAS = true;
var SHOW_FIRE = true;

// create listenning sign
var objSign = gui.createLabel("<color=red>IDLE</color>", Rect(5, 38, 120, 30));

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
function show_banner_and_effect(obj) {
	if (T_Banner_List[obj.getProperty("name")] == null) {
		util.download({
			"url": BASE_URL + "outline_button.bundle",
			"success": function (res) {
				var banner_ui = gui.create(res);
				var offsetY = obj.size.y + 0.2;
				banner_ui.setObject(obj, Vector3(0, offsetY, 0));
				var msg = "<size=9>" + obj.getProperty("occurance") + "</size>\n<size=11>" + obj.getProperty("name") + "</size>";
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
		util.setTimeout(function () {
			//show real fire
			if (obj.getProperty("source") == "fire") {
				var fireEffectObject = object.create("4483E64D87BA49F8AA9AAA693194A541", obj, Vector3(0, -1, 0));
				T_Fire_List[obj.getProperty("name")] = fireEffectObject;
			}
			if (obj.getProperty("source") == "gas") {
				var gasEffectObject = object.create("4C818E5DF22C429FA73B47F88DBCD7BA", obj, Vector3(0, -1, 0));
				T_Gas_List[obj.getProperty("name")] = gasEffectObject;
			}
		}, 500);
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
			"complete": function () {}
		});
	}
}

//fly to sensor level
function fly_to_sensor_level(sensorObj) {
	//only one building TTCK
	var building = world.buildingList.get_Item(0);
	util.setTimeout(function () {
		level.change(building);
		util.setTimeout(function () {
			var floor_index = get_floor_by_objname(sensorObj.getProperty("location"));
			var floor = building.planList.get_Item(floor_index);
			level.change(floor);
		}, 500);
	}, 100);

	//show nearby camera
	var tmpArray = string.split(sensorObj.getProperty('camStr'), "_");
	for (var i = 0; i < array.count(tmpArray); i++) {
		if (tmpArray[i] != 'nan') {
			open_camera_live_feed(tmpArray[i])
		}
	}
}

//open camera live feed
function open_camera_live_feed(objId) {
	var camObj = object.find(objId);
	if (camObj != null) {
		util.setTimeout(function () {
			selector.select(camObj);
		}, 3000);
	}
}

function remove_all_gas_alarm() {
	foreach(var item in vpairs(table.keys(T_Live_Gas_Alarm))) {
		var obj = object.find(item);
		if (obj != null) {
			obj.setColorFlash(false);
		}
		if (T_Banner_List[item] != null) {
			T_Banner_List[item].destroy();
			table.remove(T_Banner_List, item);
		}
		if (T_Gas_List[item] != null) {
			T_Gas_List[item].destroy();
			table.remove(T_Gas_List, item);
		}
		table.remove(T_Fly_List, item);
	}
	table.clear(T_Live_Gas_Alarm);
}

function remove_all_fire_alarm() {
	foreach(var item in vpairs(table.keys(T_Live_Fire_Alarm))) {
		var obj = object.find(item);
		obj.setColorFlash(false);
		if (T_Banner_List[item] != null) {
			T_Banner_List[item].destroy();
			table.remove(T_Banner_List, item);
		}
		if (T_Fire_List[item] != null) {
			T_Fire_List[item].destroy();
			table.remove(T_Fire_List, item);
		}
		table.remove(T_Fly_List, item);
	}
	table.clear(T_Live_Fire_Alarm);
}

function update_fire_alarm_table() {
	foreach(var item in vpairs(table.keys(T_Live_Fire_Alarm))) {
		if (string.contains(T_Live_Fire_Alarm[item], "fire")) {
			var fireObj = object.find(item);
			fireObj.addProperty("name", item);
			var t = string.split(T_Live_Fire_Alarm[item], "|");
			fireObj.addProperty("occurance", t[0]);
			fireObj.addProperty("name", item);
			fireObj.addProperty("location", t[3]);
			fireObj.addProperty("tranfer", t[2]);
			fireObj.addProperty("camStr", t[4]);
			fireObj.addProperty("source", "fire");
			util.setTimeout(function () {
				show_banner_and_effect(fireObj);
				fireObj.setColorFlash(true, Color.red, 2.5);
			}, 1000);
			//check if have flied once
			if (table.containskey(T_Fly_List, fireObj.getProperty("name")) == false) {
				fly_to_sensor_level(fireObj);
				T_Fly_List[fireObj.getProperty("name")] = fireObj;
			}
		} else {
			//handle recovery fire alarms
			remove_recovery_fire_alarm(item);
		}
	}
}

function update_gas_alarm_table(flyObjString) {
	foreach(var item in vpairs(table.keys(T_Live_Gas_Alarm))) {
		if (string.length(T_Live_Gas_Alarm[item]) > 1) {
			var gasObj = object.find(item);
			var t = string.split(T_Live_Gas_Alarm[item], "|");
			gasObj.addProperty("name", item);
			gasObj.addProperty("occurance", t[0]);
			gasObj.addProperty("location", t[2]);
			gasObj.addProperty("source", "gas");
			gasObj.addProperty("camStr", t[3]);
			util.setTimeout(function () {
				gasObj.setColorFlash(true, Color.red, 2.5);
				show_banner_and_effect(gasObj);
				//check if have flied once and only fly to first gas sensor
				var if_fly = string.contains(flyObjString, gasObj.getProperty("name"))
					if (table.containskey(T_Fly_List, gasObj.getProperty("name")) == false && if_fly == true) {
						fly_to_sensor_level(gasObj);
						T_Fly_List[gasObj.getProperty("name")] = gasObj;
					}
			}, 1000);
		}
	}
}

function remove_recovery_fire_alarm(item) {
	if(table.containskey(T_Fly_List, item)) {
		table.remove(T_Fly_List, item);
		destory_element_by_name(T_Banner_List, item);
		destory_element_by_name(T_Fire_List, item);
		var obj = object.find(item);
		if (obj != null) {
			obj.setColorFlash(false)
		}
	}
}

function remove_recovery_gas_alarm(msgArray) {
	foreach(var item in vpairs(table.keys(T_Live_Gas_Alarm))) {
		var recovery = true;
		for (var i = 0; i < array.count(msgArray); i++) {
			if (string.contains(msgArray[i], item)) {
				recovery = false;
			}
		}
		if (recovery == true) {
			var messageObj = gui.createLabel("<color=red>" + item + " recoveried!</color>", Rect(150, 38, 200, 30));
			table.remove(T_Live_Gas_Alarm, item);
			table.remove(T_Fly_List, item);
			util.setTimeout(function () {
				gui.destroy(messageObj);
				destory_element_by_name(T_Banner_List, item);
				destory_element_by_name(T_Gas_List, item);
				var obj = object.find(item);
				if (obj != null) {
					obj.setColorFlash(false);
				}
			}, 3000);
		}
	}
}

gui.createButton("Listen", Rect(40, 220, 60, 30), function () {
	if (LISTENING == false) {
		gui.destroy(objSign);
		objSign = gui.createLabel("<color=green>LISTENING</color>", Rect(5, 38, 120, 30));
		LISTENING = true;
		util.setInterval(function () {
			if (LISTENING) {
				//polling for fire information
				if (SHOW_FIRE == true) {
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
								update_fire_alarm_table();
							} else {
								remove_all_fire_alarm();
							}

						},
						"error": function (t) {
							print(t);
						}
					});
				}
				//polling for gas information
				if (SHOW_GAS == true) {
					util.download({
						"url": BASE_URL + "gas",
						"type": "text",
						"success": function (rs) {
							if (string.length(rs) > 10) {
								rs = string.trim(rs);
								var msgArray = string.split(rs, "#");
								remove_recovery_gas_alarm(msgArray);
								if (array.count(msgArray) > 0) {
									for (var i = 0; i < array.count(msgArray); i++) {
										tmpArray = string.split(msgArray[i], "|");
										T_Live_Gas_Alarm[tmpArray[1]] = msgArray[i];
									}
									update_gas_alarm_table(msgArray[0]);
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
			}
		},
			3000);
	}
});

function destoy_elements(T_Object_List) {
	foreach(var item in vpairs(table.keys(T_Object_List))) {
		if (T_Object_List[item] != null) {
			T_Object_List[item].destroy();
		}
	}

}

function destory_element_by_name(T_Object_List, objName) {
	foreach(var item in vpairs(table.keys(T_Object_List))) {
		if (item == objName && T_Object_List[item] != null) {
			T_Object_List[item].destroy();
			table.remove(T_Object_List, item);
		}
	}
}

function stop_all_flash() {
	foreach(var item in vpairs(table.keys(T_Live_Fire_Alarm))) {
		var obj = object.find(item);
		if (obj != null) {
			obj.setColorFlash(false);
		}
	}
	foreach(var item in vpairs(table.keys(T_Live_Gas_Alarm))) {
		var obj = object.find(item);
		if (obj != null) {
			obj.setColorFlash(false);
		}
	}
}

gui.createButton("Reset", Rect(40, 260, 60, 30), function () {
	util.clearAllTimers();
	selector.ClearSelection();
	//remove all existing banners and effects
	stop_all_flash();
	destoy_elements(T_Banner_List);
	destoy_elements(T_Fire_List);
	destoy_elements(T_Gas_List);

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
				table.clear(T_Live_Gas_Alarm);
				table.clear(T_Fly_List);
			}, 500);
		}
	});
	gui.destroy(objSign);
	objSign = gui.createLabel("<color=red>IDLE</color>", Rect(5, 38, 120, 30));
});
