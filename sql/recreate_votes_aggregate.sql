delete from votes_aggregate;
insert into votes_aggregate select concat(receivedAddress, sentAddress), sentAddress, receivedAddress, sum(amount), min(timestamp) from votes group by sentAddress, receivedAddress;
