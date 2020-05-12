var BookInstance = require('../models/bookinstance');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var async = require('async');
var Book = require('../models/book');
// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
    .populate('Book')
    .exec(function(err, list_bookinstances){
    	if(err) {
    		return next(err);
    	}
    	//successful, render
    	res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances })
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
    
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance});
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
    .exec(function(err, books){
    	if(err) return next(err);
    	//
    	 res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
        // Validate fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req,res,next)=>{
    	const errors = validationResult(req);

    	// Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });
        if(!errors.isEmpty()){
        	//error exists, render form again
        	    Book.find({}, 'title')
			    .exec(function(err, results){
			    	if(err) return next(err);
			    	//
			    	 res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
			    });
			    return;
        }
        else{
        	bookinstance.save(function(err){
        		if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
               
        	});
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    async.parallel({
    	bookinstance:function(callback){
    		BookInstance.findById(req.params.id).exec(callback);
    	},
    },function(err, results){
    	if(err) return next(err);
    	if(results.bookinstance == null){
    		res.redirect('/catalog/bookinstances');
    	}
        //
        else{
            res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance: results.bookinstance } );
        }
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
    async.parallel({
    	bookinstances:function(callback){
    		BookInstance.findById(req.body.bookinstanceid).exec(callback);
    	},
    },function(err, results){
    	if(err) return next(err);
        //
        console.log("delete book instance")
        BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookInstance(err){
        	if(err) return next(err);
        		res.redirect('/catalog/bookinstances');
        	})
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
    	bookinstance:function(callback){
    		BookInstance.findById(req.params.id).exec(callback)
    	},        
    	books: function(callback) {
            Book.find(callback)
        },
    },function(err, results){
    	if(err) return next(err);
    	if(results.bookinstance == null){
            var err = new Error('Book Instance not found');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_form', { title: 'Update Book Instance', book_list : results.books, selected_book : results.bookinstance.book._id, bookinstance:results.bookinstance });
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
	body('book', 'Name must not be empty.').trim().isLength({ min: 1 }),
	body('imprint', 'imprint must not be empty.').trim().isLength({ min: 1 }),
	body('due_back', 'dueback must not be empty.').trim().isLength({ min: 1 }),
   
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').escape(),
    sanitizeBody('due_back').escape(),

    (req, res, next) =>{
    	const errors = validationResult(req);
    	// Create a Book object with escaped/trimmed data and old id.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id:req.params.id //This is required, or a new ID will be assigned!
           });
        if(!errors.isEmpty()){
        	Book.find({},'title')
        	.exec(function(err, books){
        		if(err){
		            return next(err);
		        }
		        res.render('bookinstance_form', { title: 'Update Book Instance', book_list: books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
            
        	});
        	return;
        }
        else{
        	BookInstance.findByIdAndUpdate(req.params.id, BookInstance, {}, function(err, thebookinstance){
        		if(err){
		            return next(err);
		        }
		        res.redirect(thebookinstance.url);
        	});
       }
    }
];