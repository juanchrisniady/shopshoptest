const gapi = require("./utils/gapi");
const validation = require("./utils/validation")
const createError     = require('http-errors');
const express         = require('express');
const path            = require('path');
const cookieParser    = require('cookie-parser');
const bodyParser      = require('body-parser');
const logger          = require('morgan');
const multer          = require('multer');
const request 		  = require("request");
const fs              = require('fs');

const app             = express();
const ret = {};
const valid_seller    = (process.env.VALID_SELLER).split(", ");

const ongkirapi = process.env.ONGKIR;
const SUBS_PATH = 'subdistrict.json'

// view engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(multer().array());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(req, res){
  
  // Give main pug form
  
		setup(req,res)
		  
  
});

function setup(req, res){
	
	fs.readFile(SUBS_PATH, (err, content) => {
		if (err) return console.log('Error loading file:', err);
		var data = JSON.parse(content)
		for(var i in data){
			ret[ data[i]['subdistrict_name'] + "," + data[i]['city'] + ", " + data[i]['province'] ] = data[i]['subdistrict_id'] + ", " + data[i]['subdistrict_name'] + "," + data[i]['city'] + ", " + data[i]['province'];
		}
		res.render('main-form', {
				Addresses: ret,
		});
		
	});
	/**
		var options = {
		  method: 'GET',
		  url: 'https://pro.rajaongkir.com/api/city',
		  qs: {},
		  headers: {key: ongkirapi}
		};
		
		request(options, function (error, response, body) {
		  if (error) throw new Error(error);

		  var obj = JSON.parse(body).rajaongkir.results;
		  for(var i in obj) {
			  ret[ obj[i]['city_name'] + ", " + obj[i]['province'] ] = obj[i]['city_id'] + ", " + obj[i]['city_name'] + ", " + obj[i]['province'];
		  }
		  
		  res.render('main-form', {
				Addresses: ret,
				});
		  // console.log(ret["Cirebon, Jawa Barat"]); // 109, 9
		});
		**/
}

const { check, validationResult } = require('express-validator'); 

app.post('/submit', [
	check('seller')
		.notEmpty(),
	check('name')
		.notEmpty(),
	check('phone')
		.notEmpty(),
	check('address')
		.notEmpty(),
	check('address_id')
		.notEmpty(),
	check('shipping')
		.notEmpty(),
		
	], (req, res) => {
		const errors = validationResult(req);
		const rowsToInsert = req.body;
		console.log(rowsToInsert);
		if(ret[rowsToInsert["address_id"]] == null ){
			console.log(ret[rowsToInsert["address_id"]]);
			res.render('main-form', {msg: 'Mohon isi data Kec/Kota/Provinsi yang benar', Addresses: ret});
			return;
		}
		if(!valid_seller.includes(rowsToInsert["seller"])){
			console.log(ret[rowsToInsert["address_id"]]);
			res.render('main-form', {msg: 'Mohon isi Kode Penjual dengan benar', Addresses: ret});
			return;
		}
		rowsToInsert["address_id"] = ret[rowsToInsert["address_id"]];
		sub_id = rowsToInsert["address_id"].split(', ')[0];
		subdistrict = rowsToInsert["address_id"].split(', ')[1];
		city = rowsToInsert["address_id"].split(', ')[2];
		province = rowsToInsert["address_id"].split(', ')[3];
		address = rowsToInsert["address"] 
		courier = rowsToInsert["shipping"]
		
		if (!errors.isEmpty()) { 
			const alert = errors.array();
			res.render('main-form', {msg: 'Mohon isi data yang lengkap', Addresses: ret});
		} else {
			res.render("thank-you");
			
			
			var options = {
			  method: 'POST',
			  url: 'https://pro.rajaongkir.com/api/cost',
			  headers: {key: ongkirapi, 'content-type': 'application/x-www-form-urlencoded'},
			  form: {
				origin: '109',
				originType: 'city',
				destination: sub_id,
				destinationType: 'subdistrict',
				weight: 1290,
				courier: courier
			  }
			};

			request(options, function (error, response, body) {
			  if (error) throw new Error(error);
				var cost = JSON.parse(body).rajaongkir.results[0].costs[0].cost[0].value;
				rowsToInsert['cost'] = cost;
				rowsToInsert['subdistrict_id'] = sub_id;
				rowsToInsert['subdistrict'] = subdistrict;
				rowsToInsert['city'] = city;
				rowsToInsert['province'] = province;
				console.log(rowsToInsert);
				gapi.authenticateAndAppend(rowsToInsert);
			});
			
			
			
			
			
			//req.flash('success', 'Subscription confirmed.');
		}
		
	});

/**
app.post('/submit', function(request, response){

  // log the response
  const rowsToInsert = request.body;
  console.log(rowsToInsert);
  const seller = request.body.seller;
  request.checkBody('seller', 'Please enter employee first name').notEmpty();
  let errors = request.validationErrors();
  if(errors)
    {
        response.render('emp_add', {
            errors: errors
        });
    }
  else {
	  gapi.authenticateAndAppend(rowsToInsert);
    response.render("thank-you");
  }
});
**/

app.get('/submit', function(request, response){

  // log the response
  console.log(request.body);
  response.redirect("/");
});
// error handling code - to catch invalid  URL and

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler - for all other errors
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err.message)
});

//listens to server at port 3000
app.listen(8000);
module.exports = app;
