//---------------------------------------------
// tel scene id: 20170902015219229693920
//---------------------------------------------

//global init settings
var LISTENING = false;
var T_Live_Alarm = {};
var CURRENT_LEVEL = 'world';
var BASE_URL = "http://192.168.86.24:9006/";
var T_Banner_List = {};
var T_Banner_Count = 0;

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

function show_banner(obj) {
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
			T_Banner_List[T_Banner_Count] = banner_ui;
			T_Banner_Count = T_Banner_Count + 1;
		}
	});

}
//react to fire alarm
function fly_to_object(fireObj) {
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
		}, 100);
	}
	util.setTimeout(function () {
		show_banner(fireObj);
		fireObj.setColorFlash(true, Color.red, 2.5);
	}, 2000);
}

//react to gas alarm
function fly_to_gas_object(gasArray) {
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
		}, 100);
	}
	for (var i = 0; i < array.count(gasArray); i++) {
		tmpArray = string.split(gasArray[i], "|");
		var gasObj = object.find(tmpArray[0]);
		gasObj.addProperty("occurance", tmpArray[1]);
		gasObj.addProperty("name", tmpArray[0]);
		util.setTimeout(function () {
			gasObj.setColorFlash(true, Color.red, 2.5);
			show_banner(gasObj);
		}, 2000);
	}
	//disable listening
	util.setTimeout(function () {
		LISTENING = false;
	}, 5000);
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
								T_Live_Alarm[tmpArray[3]] = msgArray[i];
							}
							foreach(var item in vpairs(table.keys(T_Live_Alarm))) {
								if (string.contains(T_Live_Alarm[item], "fire")) {
									var fireObj = object.find(item);
									fireObj.addProperty("name", item);
									var t = string.split(T_Live_Alarm[item], "|");
									fireObj.addProperty("occurance", t[0]);
									fireObj.addProperty("name", item);
									fireObj.addProperty("tranfer", t[2]);
									fly_to_object(fireObj);
								} else {
									table.remove(T_Live_Alarm, item);
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
								fly_to_gas_object(gasArray);
							}
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
	for (var i = 0; i < T_Banner_Count; i++) {
		if (T_Banner_List[i] != null) {
			T_Banner_List[i].destroy();
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
				table.clear(T_Live_Alarm);
				T_Banner_Count = 0;
			}, 500);
		}
	});
});
