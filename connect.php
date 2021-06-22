<?php

$m =  new MongoDB\Client(
    'mongodb+srv://test:test@cluster0.laqhj.mongodb.net/teknia?retryWrites=true&w=majority');
	
echo "Connection to database successfully";
// select a database
$db = $m->teknia;
 
echo "Database mydb selected";
>
<link href="css/jquery.dataTables.min.css" rel="stylesheet"/>
