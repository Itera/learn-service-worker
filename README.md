# Learn to use ServiceWorkers

This is a repository with small tasks to enable offline features with
ServiceWorkers in a simple web-app.

The application is a simple application for listing commits from GitHub. The
goal is to make the application work offline by using ServiceWorkers.

## Tasks

If you run into any problems, ask one of the instructors, or look under the
pitfalls/resources sections at the bottom of this readme. Remember to check
verification steps before starting on a new task :v:

### 1. Clone the project and start the server

To be able to set up the project you need to ensure that you have installed:

1. **Node** version 4 or newer (run `node -v` for checking version)
2. Newest **Chrome** stable or Chrome Canary

Use your favorite git client to **clone the repository** by running `git clone
https://github.com/Itera/learn-service-worker` in a terminal. After cloning the
repository you can run `npm install` inside the project folder. You can get to
the project folder by running `cd learn-service-worker` from where you cloned
the project.

Now you should be ready to **start the server** with the command `npm start`.
It will start everything and make it accessible for you at
http://localhost:3000.

**Verification step:** When opening http://localhost:3000 in the browser you
should see the GitHub logo and a list of commits. The application now works as
a standard web page and if you turn off the network the web page will not load
(in Chrome you will get the error message `ERR_INTERNET_DISCONNECTED` in the
DevTools console).

In the `test` folder you will find implemented tests for each task. To run all
tests run `npm test`. If you have done everything described in this task you
should now see one test pass and the rest of the tests should fail. The failing
tests are created to verify that your implementation is working as expected for
upcoming tasks.

Let's start making the application work offline! :rocket:

### 2. Install the ServiceWorker (main.js)

In `main.js` you will find the following if statement:

```js
if ('serviceWorker' in navigator) {

}
```

Inside it, we want to import the ServiceWorker and register it, which can be
done with the following code:

```js
navigator.serviceWorker
  .register('/service-worker.js')
```

The register call returns a [Promise][nolan-lawson-promise-blogpost]. If you
are unfamiliar with promises now is a good time to ask one of the instructors
for a quick introduction. Since the function returns a promise we can add
functions that will run when the ServiceWorker is successfully registered, or
if it fails. See the example below:

```js
navigator.serviceWorker
  .register('/service-worker.js')
  .then(function (registration) {
    // Registration was successful
    console.log('ServiceWorker registration successful with scope: ', registration.scope);
  })
  .catch(function (err) {
    // registration failed :(
    console.log('ServiceWorker registration failed: ', err);
  });
```

**How to verify your implementation:**

1. Verify that your implementation works by running the tests (`npm test`)
2. You can verify your implementation manually by checking that your
   ServiceWorker is registered in your browser. In Chrome you can do this by
   opening DevTools -> Click on "Application" -> Check for registered
   ServiceWorker. You should be able to find `service-worker.js`.
3. Use `console.log()` to notify you if the ServiceWorker was registered
   successfully or not. All log statements can be found by looking in the
   console window in Chrome DevTools.

Let us make it a bit better.

### 3. Pre-cache known files (service-worker.js)

Congratulation! By now you have registered your ServiceWorker and we are ready
to cache.

#### 3a. Create list of known files

In `service-worker.js` you will find:

```js
const urls = [ ... ]
```

`urls` is a list of known files to be cached. Uncomment the variable. Why
should the list of files in `urls` be cached? Go to the next subtask to ensure
that the files specified in `urls` are cached.

#### 3b. Pre-cache known files

After the ServiceWorker is registered, the browser will install and activate
it. When it has completed successfully, an install event will be fired. We will
use this to cache the assets the app needs to run so that it may run offline.

The cache can be interacted with by running:

```js
caches.open(cacheName)
```

The `cacheName` specifies which cache you want to use. Typically, this includes
the version number, so you can use a new cache for the updated resources when
you release a new version.

The method will return a promise, which resolves to the cache object. You can
use this cache object to add the files you want to cache. The `addAll` method
takes in an array of URLs, retrieves them, and adds the responses to the cache.

It is important to wrap the call with a Promise that resolves when everything
you want to do in the install event is done. If not, the worker will be marked
as installed and will be activated before it is ready. We do this by moving the
whole `caches.open` chain into `event.waitUntil`:

```js
event.waitUntil(
  caches.open(CACHE_NAME)
    .then(function (cache) {
      //...
    })
  );
```

**Verification step:** Open up DevTools and go to the Application tab. In the
sidebar, it is a pane called "Cache Storage". Click on it and you should see
that all the files in URLs list are in the `awesome-app--cache-v1` cache.

### 4. Answer requests with stuff from cache (service-worker.js)

Cool, so now we have cached some files that we want to work offline.
:raised_hands: The cache will not help much unless we use it. ServiceWorkers
have an event `fetch` that we can use for that. The fetch event makes it
possible intercept every HTTP request the browser does from the page where we
attached the ServiceWorker.

The first thing we will do is to intercept all the requests, but we are going
to let them pass through so that they work as if there were no cache. Below you
can see the code that will do that.

```js
self.addEventListener('fetch', function (event) {
  console.log('Requested: ', event.request.url);
  const fetchRequest = event.request.clone();
  event.respondWith(fetch(fetchRequest));
});
```

`fetch()` is a built-in function for doing network requests. It is able to take
another request and perform it. It can also be used with a url,
e.g.`fetch('https://itera.no')`. On the third line, we're cloning the request.
If we did not do this, we would not be able to call another fetch with the same
request.

**Verification step:** Check your DevTools console for log statements that
says: `Requested:  http://localhost:3000/main.css`

The next step is to look in the cache and return the content if we already have
it cached. Remember earlier we cached a list of files that we know we need for
the application. Using the interception above, we can return those files
instead. The first thing to do is putting `caches.match` into
`event.respondWith` so that we end up with this:

```js
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (cacheResponse) {
        if (cacheResponse) {
          return cacheResponse;
        }

        const fetchRequest = event.request.clone();
        return fetch(fetchRequest);
      })
  );
});
```

The `caches.match` function will check all the caches for a file with the given
URL. It returns a Promise with the response from the cache. If the cache
contains what we are looking for it will be a response object. In that case, we
want to return it so that it ends up in `event.respondWith`. What about when we
have not cached the file? :scream: No problem, we can do what we did earlier.
We clone the original request and send it to fetch. Then, we return the Promise
that we get from fetch. This will also end up in `event.respondWith` as in the
previous example.

**It should work offline now :v:** Or sort of, at least we are able to load the
application.

![Yeey](https://media.giphy.com/media/A0hj6ifaamaqs/giphy.gif)

**Verification step:** Toggle the offline checkbox on the ServiceWorker page in
DevTools. Everything should not work at this stage, but you should see the page
with a logo and a header. The commit messages and the avatars are not present.

Let us cache some more content to make this web page a bit more useful offline!

### 5. If not in cache: request it and then cache it (service-worker.js)

In addition to caching the assets, we would like to cache the other requests
that are done. This makes the whole app work when you are offline. Of course,
you won't get any new data when you are offline, but you will be able to see
the same page as you did when you were online.

To do this, we continue from the `fetch` method call from task 4. This will
return a promise, which resolves to the response of the request. The first
thing we should do with the response is to check that it is a successful
response. Since we do not fetch the same request again if it exists in the
cache, we do not want to cache failures, as this would make a temporary error
permanent.

This can be done by checking that the response is truthy, that the status code
is 200 and that it is a normal HTTP request (and not e.g. WebSockets). For
these responses, we just want to return them, without putting them in the
cache. The check can be done by using the following code:

```js
if (!response || response.status !== 200 || response.type !== 'basic') {
  return response;
}
```

If the response was successful, we continue with inserting the response in the
cache. The response object can only be used once, so before we insert it to the
cache we need to clone it with `.clone()`, because we are also going to return
it. After this, you should open the cache again like you did in task 3. This
time, we are going to put the response we got into the cache, instead of only
specifying the URL. It can be done like this:

```js
cache.put(event.request, responseClone);
```

At last, outside of the cache, we need to return the response object.

**Verification step:** Toggle the offline checkbox again like in task 4, and
refresh the page. This time, you should see the same content like when the page
was online, including the list of commits and the avatars :raised_hands:

**Note:** If you wonder why the list of commits doesn't update anymore after
completing this task, we will explain it in the next task.

### 6. Do not cache API responses (service-worker.js)

So now we have all our assets cached. However, there is a problem. The cache in
the previous task is always used when data is in the cache, so the asset is
never fetched again. This is fine for static assets which don't change, but not
useful for API calls which often change content. Note that if you try to
refresh the page, the content will never change, even when you are online.

Instead of using the ServiceWorker cache which is made for static assets, we
are going to use IndexedDB for the API responses. IndexedDB is an API for
storing significant amounts of structured data in the browser. Unlike the
cache, it is meant for dynamic and custom data. Unlike localStorage, it is
asynchronous and available from the ServiceWorkers.

We will implement the usage of IndexedDB in the next task, but first, we have
to filter out the API responses from the cache insertion we made in the
ServiceWorker. Find the `cache.put` call in `service-worker.js` from the
previous task. Insert a condition around it for the request not to be to the
API, like this:

```js
if (event.request.url.indexOf('/api') === -1) {
  //...
}
```

**Verification step:** Open up DevTools and go to "Clear Storage" under the
Application tab. Scroll to the bottom and click "Clear site data". This will
remove the API response from the cache so it is fetched again. Refresh the page
multiple times and check that the content changes each time. Note that if you
go offline, the list of commits will not appear.

### 7. Store data to and get data from IndexedDB (main.js)

The last task might have felt like a step back since the app doesn't work when
offline anymore, so let's get right on fixing that. To simplify the usage of
IndexedDB, we use the library [idb-keyval][idb-keyval], which lets you use it
as a key-value store. You can insert data into it with `.set` by providing a
name and some data. To retrieve it, call `.get` with the same name.

#### 7a. Store data to IndexedDB

The first thing we need to do is to insert the list of commits into the
IndexedDB. We are going to do this when receiving the commits, like this:

```js
idbKeyval.set('commits', commits);
```

#### 7b. Get data from IndexedDB

After this, we want to read from the IndexedDB when the app loads. We could
check if the app has a network connection, and only load from IndexedDB when it
is offline, since we are going to load from the network when we are online.
However, if we load from the IndexedDB on load even when the app is online, the
user will see the content immediately. Therefore, we will load from IndexedDB
in `main.js` without any conditions. You can load from IndexedDB with:

```js
idbKeyval.get('commits')
```

This will return a promise which will resolve to the object you inserted. You
can use this object to render the list of commits. Before you do that though,
you should check that you actually got anything, so you don't call render when
the IndexedDB is empty. Then we end up with this:

```js
idbKeyval.get('commits')
  .then(function (commits) {
    if (commits) {
      render(commits);
    }
  });
```

**Verification step:** When you now go offline and refresh the page, you should
still see the list of commits. Each time you refresh the page when you are
online, you should get a new list of commits (wait a few seconds if you get the
same list). When you go offline and refresh, you should get the same list as
the last time you were online.

### 8. Add background sync

Once the commits are stored and read with IndexedDB, we are able to display the
old commits while we are loading the new ones. But what happens if we're
offline or have a bad internet connection when we load the cached page, and the
request for updated commits times out before we get the new content?

Preferably, we want the app to fetch the new commits by itself when the browser
gets a stable internet connection, and this is where *background sync* comes
into place. With background sync we can ask for an event to be fired when we
get connectivity, and we can register a listener to this event.

In our case, we can use background sync to fetch the new commits only when we
have a connection. If we have connectivity when we open the app the behavior
will be like before, but if the connection is poor, the app will wait to
request the new commits until the event is fired.

#### 8a. Implement the event handler (service-worker.js)

The first thing we need to do is to implement an event listener for the `sync`
event. Below you get the boiler plate code for adding the event handler, it is
up to you to add the implementation.

```js
self.addEventListener('sync', function (event) {
  // TODO: update commits
});
```

Note: It is important that the commits are fully resolved before returning from
this event handler, a hint is to see what you did at the end of task 3 if
you're stuck on how to do this.

#### 8b. Ask for the sync event to be fired (main.js)

Now that our event handler is implemented, we need it to be called when our app
gets a connection. First, we need to check that the system supports background
sync.

```js
if ('SyncManager' in window) {
  // register our app for the `sync` event
}
```

And once we know that our system supports background sync we can register our
app for a one-off sync.

```js
navigator.serviceWorker.ready
  .then(function (swRegistration) {
    return swRegistration.sync.register('commits');
  });
```

Note the `commits` tag that is passed to the `register` function. This tag can
be used to distinguish different `sync`-events from each other. We have ignored
the tag in our event handler, but if we want to be more thorough we can go back
to our event handler and make sure that the `updateCommits` function is only
called if the `sync`-event has a `commits`-tag.

```js
self.addEventListener('sync', function (event) {
  if (event.tag === 'commits') {
    // TODO: update commits
  }
});
```

Great, you now have background sync for your app! This will enable our app to
retrieve updated commits in the background, even when you're not displaying the
web page on your phone!

**Verification step:** Add a `console.log(event)` statement to your event
handler to print out the event. It should display when your app gets
connection, which is almost immediately if you are already connected when you
refresh the page.

### 9. :sparkles:

### Bonus Task 1

Deploy it with `now`. Run the following commands.

```sh
npm install -g now
now
```

### Bonus Task 2

Rewrite the app to insert the commits into IndexedDB after they are fetched,
both from the ServiceWorker and from `main.js`. When you render the list, get
it from the IndexedDB.

This means that we do not need to send the list of commits in the message we
send from the ServiceWorker to `main.js`. Moving data from the ServiceWorker to
`main.js` via IndexedDB instead of with a message is faster.

Ask an instructor if you need more details on this task.

## Pitfalls

* If you press Ctrl-F5 or Shift-F5, the ServiceWorker will be bypassed
  completely. This means that fetch requests will not go through the fetch
  listener in the ServiceWorker.
* If you have multiple tabs open with the app, the log for the service worker
  will only be shown in one them.

## Resources

- https://jakearchibald.com/2014/offline-cookbook/
- https://github.com/TalAter/awesome-service-workers
- https://github.com/hemanth/awesome-pwa
- https://medium.com/dev-channel/offline-storage-for-progressive-web-apps-70d52695513c#.4vo2banfg
- https://github.com/jakearchibald/idb-keyval - Library for IndexedDB that is
  used, look in the readme for docs.

[nolan-lawson-promise-blogpost]: https://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html
[idb-keyval]: https://github.com/jakearchibald/idb-keyval
