var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
let multer = require('multer');

var app = express();


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

app.post('/submit', function(request, response){

  // log the response
  console.log(request.body);
  response.render("thank-you");
});


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
  res.render('error');
});

//listens to server at port 3000
app.listen(8000);
module.exports = app;
