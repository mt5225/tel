CREATE TABLE IF NOT EXISTS alarms (
    occurrences varchar(64),
    msg varchar(64),
    repeater varchar(64),
    sensor varchar(64)
);

insert into alarms values ('2017-10-15 05:31:38', 'recover', '019', '3F-6');
insert into  alarms values ('2017-10-15 05:31:38', 'fire', '019', '3F-6');