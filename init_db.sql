CREATE TABLE IF NOT EXISTS fire_alarms (
    id MEDIUMINT NOT NULL AUTO_INCREMENT,
    occurrences varchar(64),
    msg varchar(64),
    repeater varchar(64),
    sensor varchar(64),
    primary key (id)
);

insert into fire_alarms (occurrences, msg, repeater, sensor) values ('2017-10-15 05:31:38', 'recover', '019', '3F-6');
insert into fire_alarms (occurrences, msg, repeater, sensor) values ('2017-10-15 05:31:38', 'fire', '019', '3F-6');

