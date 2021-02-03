const gapi = require("./utils/gapi");
const createError     = require('http-errors');
const express         = require('express');
const path            = require('path');
const cookieParser    = require('cookie-parser');
const bodyParser      = require('body-parser');
const logger          = require('morgan');
const multer          = require('multer');
const request 		    = require("request");
const fs              = require('fs');
const moment          = require('moment');

const app             = express();
const ret = {};
const valid_seller    = (process.env.VALID_SELLER).split(", ");
const seller_price    = JSON.parse(process.env.SELLER_PRICE);
const ongkirapi       = process.env.ONGKIR;

const SUBS_PATH       = 'subdistrict.json'
const ORDER_ID_NAME = "TEKNIA";
const ORDER_ID_LOW = 1020;
// bad use of global var but is ok
var ORDER_ID_CURR = 0;


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

/** Utils and helper functions */


/** Main routes */
function setup(req, res){
	
	fs.readFile(SUBS_PATH, (err, content) => {
		if (err) return console.log('Error loading file:', err);
		const subdistricts = JSON.parse(content)
		for(const subdistrict in subdistricts) {

      // FIXME ini apaan, rename subKey and subValue with somethin nicer
      const subKey = data[subdistrict]['subdistrict_name'] + ", " + data[subdistrict]['city'] + ", " + data[subdistrict]['province']
      const subValue = data[subdistrict]['subdistrict_id'] + ", " + data[subdistrict]['subdistrict_name'] + ", " + data[subdistrict]['city'] + ", " + data[subdistrict]['province']
      
      ret[subKey] = subValue
    }
    
		res.render('main-form', {
				Addresses: ret,
		});
		
  });
  // FIXME hapus dead comment code
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
    
    // ======================= FIXME START EXTRACT HERE TO new function ================== //
		if(ret[rowsToInsert["address_id"]] == null ){
			res.render('main-form', {msg: 'Mohon isi data Kec/Kota/Provinsi yang benar', Addresses: ret});
			return;
		}
		if(!valid_seller.includes(rowsToInsert["seller"])){
			res.render('main-form', {msg: 'Mohon isi Kode Penjual dengan benar', Addresses: ret});
			return;
		}
		var phone = rowsToInsert["phone"];
		if( isNaN(phone) || !( phone.startsWith("08")  )){
			res.render('main-form', {msg: 'Nomor telfon berawal 08, jangan pakai spasi', Addresses: ret});
			return;
    }
    // ========================= END extract here ===================== //

    rowsToInsert["address_id"] = ret[rowsToInsert["address_id"]];
    
		var seller_id = rowsToInsert["seller"];
		var sub_id = rowsToInsert["address_id"].split(', ')[0];
		var subdistrict = rowsToInsert["address_id"].split(', ')[1];
		var city = rowsToInsert["address_id"].split(', ')[2];
		var province = rowsToInsert["address_id"].split(', ')[3];
		var address = rowsToInsert["address"] 
		var courier = rowsToInsert["shipping"]
		ORDER_ID_CURR++; // Move this to somewhere that makes is logical, not directly before this is being used
		var currOrderNum = ORDER_ID_CURR + ORDER_ID_LOW;
    var currOrderId = ORDER_ID_NAME + currOrderNum;
    
    // FIXME Move this right after validationResult(req), why process stuff if we know there is an error
    // refactor the else out
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
        // FIXMEYo refactor
				var cost = JSON.parse(body).rajaongkir.results[0].costs[0].cost[0].value;
				rowsToInsert['cost'] = cost;
				price = seller_price[seller_id.toUpperCase()];
				rowsToInsert['price'] = price;
				rowsToInsert['total_cost'] = cost + price;
				rowsToInsert['subdistrict_id'] = sub_id;
				rowsToInsert['subdistrict'] = subdistrict;
				rowsToInsert['city'] = city;
				rowsToInsert['province'] = province;
				rowsToInsert['order_date'] = moment().format("YYYY-MM-DD");
				rowsToInsert['waybill'] = "";
				rowsToInsert['status'] = "0";
				rowsToInsert['finish_data'] = "";
				rowsToInsert["address_id"] = currOrderId;
				console.log(rowsToInsert); 
				gapi.authenticateAndAppend(rowsToInsert);
			});
			
			
			
			
			
			//req.flash('success', 'Subscription confirmed.');
		}
		
	});

app.post('/checkorder', [
	check('checkSid')
		.notEmpty()
		
	], (req, res) => {
		const errors = validationResult(req);
		const rowsToInsert = req.body;
		if(!valid_seller.includes(rowsToInsert["checkSid"])){
			res.render('main-form', {msg: 'Mohon isi Kode Penjual dengan benar', Addresses: ret});
			return;
		}
		var sid = rowsToInsert["checkSid"];
		//var data = {"a":["A1","B1","C1","D1", "E1","F1","G1","H1"], "b":["A12","B12","C12","D12", "E12","F12","G12","H2"]};
		var data = gapi.authenticateAndGet(sid) ; // FIXME dont use data as a variable name
		data.then(function(result) {
      var orders = {};
      /**
       * FIXME
       * 1. var i -> const i
       * 2. x[15] assign ke variable name that makes sense
       * 3. result -> rename to response
       * 4. var x -> rename lagi, pake const
       * 5. Consider array deconstruction
       * 6. linting pls
       */
			for(var i = 0; i < result.length; i++){
				if((result[i][0]).toUpperCase() == sid.toUpperCase()){
					var x = result[i]
					var stat = "";
					if(parseInt(x[15]) == 0){
						stat= "Dalam Pengiriman";
					} else if(parseInt(x[15]) == 1) {
						stat= "Gagal Kirim";
					} else if(parseInt(x[15]) == 2){
						stat= "Selesai (Terkirim)"
          }
          // FIXME wtf
					orders[i] = [x[1], x[10],x[12],x[2],x[13],x[14],stat,x[16]];
				}
      }
      
			res.render("cek-pesanan", {orders:orders});
		})
		
		//name, subs, province, phone, order_date, waybill, status, end_date
		//res.render("cek-pesanan", {orders:data});
	});
	
	

// FIXME ini dikomen?
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


/** Return the user to the main page if they go to submit with a GET request */
app.get('/submit', function(request, response){

  response.redirect("/");
});

// error handling code - to catch any other error

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler - special error handler to print error message to browser
// TODO The entire function should only be enabled on dev mode 
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
