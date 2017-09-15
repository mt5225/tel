//global init settings
var LISTENING = false;
var T_Live_Alarm = {};
var CURRENT_LEVEL = 'world';

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
	var cam_pos = camera.getEyePos();

	if (Vector3.Distance(cam_pos, fireObj.center) > 50) {
		camera.flyTo({
			"eye": fireObj.center + Vector3(6, 6, 6),
			"target": fireObj.center,
			"time": 1,
			"complete": function () {
				fireObj.setColorFlash(true, Color.red, 2.5);
			}
		});
	}
}

gui.createButton("Listen", Rect(40, 220, 60, 30), function () {
	if (LISTENING == false) {
		LISTENING = true;
		util.setInterval(function () {
			util.download({
				"url": "http://192.168.86.24:9006/fire",
				"type": "text",
				"success": function (rs) {
					if (string.length(rs) > 10) {
						rs = string.trim(rs);
						msgArray = string.split(rs, "#");
						for (var i = 0; i < array.count(msgArray); i++) {
							//split and save to live event table
							tmpArray = string.split(msgArray[i], "|");
							T_Live_Alarm[tmpArray[3]] = msgArray[i];
						}
						foreach(var item in vpairs(table.keys(T_Live_Alarm))) {
							if (string.contains(T_Live_Alarm[item], "fire")) {
								var fireObj = object.find(item);
								fireObj.addProperty("name", item);
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
		}, 3000);
	}
});

gui.createButton("Reset", Rect(40, 260, 60, 30), function () {
	util.clearAllTimers();
	camera.flyTo({
		"eye": Vector3(-80, 80, -50),
		"target": Vector3(3, 4, 5),
		"time": 1,
		"complete": function () {
			LISTENING = false;
			util.setTimeout(function () {
				CURRENT_LEVEL = 'world';
				level.change(world);
			}, 500);
		}
	});
});
