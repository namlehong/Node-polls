
/*
 * Module dependencies
 */

var app = module.parent.parent.exports;

/*
 * Require poll model
 */

var Poll = require('../models/poll')
	,	utils = require('../utils.js');

app.post('/polls/create', function(req, res){
	if(req.body.options && req.body.options.length >= 2){
		// New Poll instance
		var poll = new Poll();
	
		// Add options to the poll
		req.body.options.forEach(function(option){
			poll.opts.push({title: option});
		});

		// Add a poll title
		poll.title = req.body.title;
		poll.subtitle = req.body.subtitle;
		poll.short_url = utils.shorten_url();	

		// Save the instance to the db
		poll.save(function(err, poll){
			if(!err){
				res.redirect('/polls/' + poll._id);
			} else {
				res.redirect('back');
			}
		});
	} else {
		res.redirect('back');
	}
});

app.get('/polls/:poll_id',  function(req, res){
	Poll.findById(req.params.poll_id, function(err, poll){
		if(err){
			res.redirect('back');
		} else {
			res.locals({ title: poll.title, poll: poll, json_poll: JSON.stringify(poll), auth: !!(req.session && req.session.user)});
			res.render('polls/view');
		}
	});
});


app.get('/polls/:poll_id/vote/:opt_id', function(req, res){
	if(req.session && req.session.user){
		Poll.findOne({ '_id': req.params.poll_id, 'voters': { '$nin' : [req.session.user] } }, function(err, poll){
			if(!err && poll){
				poll.opts.id(req.params.opt_id).votes++;
				poll.voters.push(req.session.user);
				opt_index = -1;
				poll.opts.forEach(function(opt, index){
					if(opt._id == req.params.opt_id) opt_index = index;
				});
				poll.save(function(){
					res.json({poll_id: req.params.poll_id, option_id: req.params.opt_id, option_index: opt_index});
				});
			} else {
				res.json("Estas intentando votar 2 veces en la misma encuesta.");
			}
		});
	} else {
		res.json("Tenes que loggearte antes de votar.");
	}
});

app.get('/p/:short_url', function(req, res){
	Poll.findOne({'short_url' : req.params.short_url}, function(err, poll){
		if(poll || !err) {
			res.redirect('/polls/' + poll._id);
		} else {
			res.redirect('/');
		}
	});
});
