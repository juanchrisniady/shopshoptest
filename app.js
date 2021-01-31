const gapi = require("./utils/gapi");
const validation = require("./utils/validation")
const createError     = require('http-errors');
const express         = require('express');
const path            = require('path');
const cookieParser    = require('cookie-parser');
const bodyParser      = require('body-parser');
const logger          = require('morgan');
const multer          = require('multer');

const app             = express();

// view engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(multer().array());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(request, response){
  
  // Give main pug form
  response.render('main-form');
});

//const { body, validationResult } = require('express-validator');
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
	check('area')
		.notEmpty(),
	check('city')
		.notEmpty(),
	check('province')
		.notEmpty(),
	check('shipping')
		.notEmpty(),
		
	], (req, res) => {
		const errors = validationResult(req);
		const rowsToInsert = req.body;
		console.log(rowsToInsert);
		if (!errors.isEmpty()) { 
			const alert = errors.array();
			res.render('main-form', {msg: 'Mohon isi data yang lengkap'});
		} else {
			gapi.authenticateAndAppend(rowsToInsert);
			res.render("thank-you");
			//req.flash('success', 'Subscription confirmed.');
			//res.redirect('back');
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
