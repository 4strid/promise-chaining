/***************
Promise Chaining
****************/

/*
 * In this example, we're going to chain a bunch of AJAX requests in order to try to get 
 * the comments of a specific blog post. Whoever wrote this API made it really inconvenient.
 * Users can only be retrieved by their username, blogs can only be retrieved by their user's
 * id, blog posts within the blog are retrieved by their title, and comments are retrieved by
 * the blog post's id.
 *
 * Usually, this sort of thing would be handled on the backend, or with better API endpoints
 * but whoever wrote the backend did so in an incredibly boorish way, so we resort to making
 * multiple requests to join the data together.
 *
 * You can uncomment the console.logs to see the results of the API requests
 **/


var apiURL = 'http://ctrl-alt-create.net/api/'

/*
 * Here's the function using ES5, that is to say, callbacks
 **/

var request = require('request')

function getComments (username, postTitle, callback) {
	request(apiURL + 'users/' + username, function (err, res, body) {
		var user = JSON.parse(body)
		//console.log(user)
		request(apiURL + 'blogs/' + user.id, function (err, res, body) {
			var blog = JSON.parse(body)
			//console.log(blog)
			request(apiURL + 'blogposts/' + blog.id + '/' + postTitle, function (err, res, body) {
				var post = JSON.parse(body)
				//console.log(post)
				request(apiURL + 'comments/' + post.id, function (err, res, body) {
					callback(JSON.parse(body))
				})
			})
		})
	})
}

/*
 * So far, so good, but we can do better using Promises. There are two major advantages that
 * using Promises provide. One is that our code is a little bit hard to read, it's kind of
 * a nested disaster, with each subsequent API call indented deeper and deeper to the right,
 * which, if you've ever had trouble lining up your indentation / braces, you know isn't
 * ideal.
 *
 * The other thing is our function has to take a callback, which is kind of annoying. If we
 * had broken up each API call into a function (not a bad idea) then each of those functions
 * would need to take a callback.
 **/

/**************
 Enter Promises
***************/
/*
 * A Promise is an object that contains the future value of an asynchronous call. It might
 * contain the result of an API call, or a call to a database, or anything that's asynchronous.
 *
 * To get the value out of the Promise, we still use a callback, but we pass it to the .then
 * method of the Promise. When the value is ready, it will call our callback and give us the
 * value.
 *
 * promiseReturningFunction().then(function (result) {
 *    // here we have the eventual value of the Promise
 * })
 *
 * Promises turn an asynchronous call into an object that you can hold in your hands, or at
 * least you can return it from a function, which is really nice. The functions we write don't
 * need to take a callback because they have a meaningful return value instead.
 *
 * Let's see what a function that uses Promises might look like, by rewriting our getComments
 * function using `request-promise` instead of `request`
 **/ 

const reqPromise = require('request-promise')

function getCommsPromisified (username, postTitle) {
	/*
	 * Everything will be going into a chain, so our `return` comes very early in the function,
	 * at the start of the chain. We're returning the final result of all the API calls
	 * chained together into one object
	 *
	 * I'm using arrow functions here since `then` functions always take one argument, so we
	 * don't need parentheses :)
	 *
	 * Also, if you have Promises, then you have arrow functions: they're both ES6
	 **/
	return reqPromise(apiURL + 'users/' + username).then(body => {
		const user = JSON.parse(body)
		// console.log(user)
		/*
		 * Here comes the magic: returing a Promise (or value) moves it to the outside of
		 * the chain
		 **/
		return reqPromise(apiURL + 'blogs/' + user.id)
	}).then(body => {
		/*
		 * Here, body contains the result of our call to reqPromise(apiURL + 'blogs/'...)
		 **/
		const blog = JSON.parse(body)
		// console.log(blog)
		return reqPromise(apiURL+ 'blogposts/' + blog.id + '/' + postTitle)
	}).then(body => {
		/*
		 * Here, body contains the result of our call to reqPromise(apiURL + 'blogposts/'...)
		 **/
		const post = JSON.parse(body)
		// console.log(post)
		return reqPromise(apiURL + 'comments/' + post.id)
	}).then(body => {
		/*
		 * Here, rather than making another Promise returning function call, we're doing a
		 * little bit of processing, parsing the body so our chain ultimately returns an
		 * Object
		 *
		 * You can either return a Promise or just a regular value inside a .then function
		 * JavaScript will handle this for you
		 **/
		return JSON.parse(body)
	})
}

/*
 * Note that we are still using callbacks, that's the only way to handle asynchronous code (*)
 * but now they're organized into .then blocks
 *
 * (*) Until we learn async/await, a powerful new feature that lets us pretend that we don't
 * need callbacks any more, but that is the subject of another blog post
 **/

// here's the function again, without all the obnoxious block comments (easier to read)
// I also moved the .thens to their own line to show another way you can format it. This is
// ultimately just a matter of style so do whatever is most readable to you. I like them on
// the same line, but this way admittedly gives you a bit more breathing room

function getCommsPromisified2 (username, postTitle) {
	return reqPromise(apiURL + 'users/' + username)
	.then(body => {
		const user = JSON.parse(body)
		return reqPromise(apiURL + 'blogs/' + user.id)
	})
	.then(body => {
		const blog = JSON.parse(body)
		return reqPromise(apiURL+ 'blogposts/' + blog.id + '/' + postTitle)
	})
	.then(body => {
		const post = JSON.parse(body)
		return reqPromise(apiURL + 'comments/' + post.id)
	})
	.then(body => {
		return JSON.parse(body)
	})
}

/*
 * I think this is quite a bit more readable than our callback version, with no deep nesting:
 * every callback occurs just one level deep, and it's very easy to see where every set of
 * braces begins and ends.
 **/

/**************
 Error Handling
***************/

/*
 * There's one more huge advantage to using Promises which is error handling. Our functions
 * we wrote above don't handle errors: if something goes wrong, the program will just
 * crash which is not ideal
 *
 * Here's the callback version with error handling built in
 **/


function getCommentsHandleErrs (username, postTitle, callback) {
	request(apiURL + 'users/' + username, function (err, res, body) {
		if (err) {
			callback(err)
		} else if (res.statusCode !== 200) {
			callback(new Error('Failed request: status ' + res.statusCode))
		} else {
			var user = JSON.parse(body)
			request(apiURL + 'blogs/' + user.id, function (err, res, body) {
				if (err) {
					callback(err)
				} else if (res.statusCode !== 200) {
					callback(new Error('Failed request: status ' + res.statusCode))
				} else {
					var blog = JSON.parse(body)
					request(apiURL + 'blogposts/' + blog.id + '/' + postTitle, function (err, res, body) {
						if (err) {
							callback(err)
						} else if (res.statusCode !== 200) {
							callback(new Error('Failed request: status ' + res.statusCode))
						} else {
							var post = JSON.parse(body)
							request(apiURL + '/comments/' + post.id, function (err, res, body) {
								if (err) {
									callback(err)
								} else if (res.statusCode !== 200) {
									callback(new Error('Failed request: status ' + res.statusCode))
								} else {
									callback(null, JSON.parse(body))
								}
							})
						}
					})
				}
			})
		}
	})
}

/*
 * ...Oh dear.
 *
 * If you didn't think it was really that bad of a rat's nest before, now it very clearly is.
 *
 * This is why we call it Callback Hell
 *
 * Let's compare it to the Promise version
 **/

function getCommsPromisifiedHandleErrs (username, postTitle) {
	return reqPromise(apiURL + 'users/' + username)
	.then(body => {
		const user = JSON.parse(body)
		return reqPromise(apiURL + 'blogs/' + user.id)
	})
	.then(body => {
		const blog = JSON.parse(body)
		return reqPromise(apiURL+ 'blogposts/' + blog.id + '/' + postTitle)
	})
	.then(body => {
		const post = JSON.parse(body)
		return reqPromise(apiURL + 'comments/' + post.id)
	})
	.then(body => {
		return JSON.parse(body)
	})
}

/*
 * Huh? Wait just a second, it doesn't look like we handled the errors at all!
 *
 * That's because the way you handle errors is with a .catch block and usually, it makes the
 * most sense to catch the errors on the outside, when we call our function
 *
 * So:
 * 
 * getCommsPromisifiedHandleErrs('peter', 'Bogus-Title').then(comments => {
 *	  console.log(comments)
 * }).catch(err => {
 *    console.error(err)
 * })
 *
 * If we were in a route of a web app, we might send a 404 or 500 error depending on what
 * the error was.
 *
 * And that's it! Just one single catch block at the end of the chain will catch errors
 * anywhere inside the chain. The subsequent .then calls won't be made, it will jump down
 * to the .catch block.
 *
 **/


/*************
 In Conclusion
**************/

/*
 * Let's summarize what we've covered today
 *
 * Promises let us return a value (in the form of a Promise) that we then call .then on on the
 * outside to get the value out, instead of having to pass in a callback.
 *
 * Promises let us chain together multiple asynchronous calls, with the magic of returning a
 * value moving that value (or promised value) to the outside of the chain.
 *
 * Inside a .then block, we can either do some processing or make another Promise returning
 * function call. Whether we return a value or a Promise, it will be accessible outside the
 * chain.
 *
 * Error handling with Promises is really simple and easy.
 * 
 **/

// here we actually call our functions
getComments('peter', 'Promise-Chaining', function (comments) {
	console.log(comments)

	console.log()
	console.log('/---------------------------\\')
	console.log('|Now the Promisified version|')
	console.log('\\---------------------------/')
	console.log()

	/*
	 * getCommsPromisifed is a Promise returning function, so to get the final result out of
	 * it we do one last .then call on the outside
	 **/
	
	getCommsPromisified('peter', 'Promise-Chaining').then(comments => {
		console.log(comments)

	/*
	 * Actually there's a little bit more to do, so we just keep on chaining
	 **/
	}).then(() => {

		console.log()
		console.log('/-------------------\\')
		console.log('|Now for some errors|')
		console.log('\\-------------------/')
		console.log()

		getCommentsHandleErrs('peter', 'Not-A-Real-Post', function (err, comments) {
			if (err) {
				console.error(err)
			} else {
				console.log(comments)
			}

			console.log()
			console.log('/---------------------------\\')
			console.log('|Now the Promisified version|')
			console.log('\\---------------------------/')
			console.log()

			getCommsPromisifiedHandleErrs('peter', 'Will-Cause-An-Error')
			.then(comments => {
				console.log(comments)
			}).catch(err => {
				console.error(err.stack)
			})
		})
	})
})
