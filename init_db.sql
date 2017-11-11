-- ----------------
-- for fire alarm
-- ----------------
CREATE TABLE IF NOT EXISTS fire_alarms (
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    occurrences varchar(64),
    msg varchar(64),
    repeater varchar(64),
    sensor varchar(64),
    primary key (id)
);

insert into fire_alarms (occurrences, msg, repeater, sensor) values ('2017-11-10 05:31:38', 'fire', '019', '3F-6');
insert into fire_alarms (occurrences, msg, repeater, sensor) values ('2017-11-10 05:31:38', 'recover', '019', '3F-6');

insert into fire_alarms (occurrences, msg, repeater, sensor) values ('2017-11-11 05:31:38', 'fire', '019', '1F-1');
insert into fire_alarms (occurrences, msg, repeater, sensor) values ('2017-11-10 05:31:38', 'recover', '019', '1F-1');



insert into fire_alarms (occurrences, msg, repeater, sensor) values ('2017-11-10 05:31:38', 'fire', '019', '2F-2');
insert into fire_alarms (occurrences, msg, repeater, sensor) values ('2017-11-10 05:31:38', 'recover', '019', '2F-2');

-- ----------------
-- for gas alarm
-- ----------------

CREATE TABLE `alarm` (
  `id` mediumint(9) NOT NULL,
  `tag` varchar(20) NOT NULL,
  `leak1` int(1) NOT NULL DEFAULT '0',
  `leak2` int(1) NOT NULL DEFAULT '0',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='gas leak sensor';

INSERT INTO `alarm` (`tag`, `leak1`, `leak2`) VALUES ('G100_HF_AL1', 1, 0);
INSERT INTO `alarm` (`tag`, `leak1`, `leak2`) VALUES ('G18_ALM', 1, 0);

INSERT INTO `alarm` (`tag`, `leak1`, `leak2`) VALUES ('G100_HF_AL1', 0, 0);
INSERT INTO `alarm` (`tag`, `leak1`, `leak2`) VALUES ('G18_ALM', 0, 0);

