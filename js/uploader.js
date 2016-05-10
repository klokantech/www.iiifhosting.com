var du_instance;
var task_id;

var uploader = document.getElementById('uploader');

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function onbeforeupload(done) {
  var veil = document.getElementById('veil');
  veil.style.display = 'block';

  var nextbtn = document.getElementById('nextbtn');
  nextbtn.onclick = function (e) {
    var name = document.getElementById('name').value,
            email = document.getElementById('email').value;

    if (name.length < 2 || !validateEmail(email)) {
      alert('Please enter your name and valid email!');
      return;
    }

    veil.style.display = 'none';
    task_id = Math.floor(Math.random() * 2147483648).toString(36) +
            Math.abs(Math.floor(Math.random() * 2147483648) ^ (+new Date())).toString(36);
    du_instance.setCustomMetadata('task_id', task_id);
    du_instance.setCustomMetadata('name', name);
    du_instance.setCustomMetadata('email', email);

    ga('send', 'event', 'Try', 'metadata_filled');
    done();
  };
}

var statusPollId;

function status_cb(data) {
  ga('send', 'event', 'Try', 'status_' + data.status, undefined, data.jobs_on_server);
  switch (data.status) {
    default:
      var status = 'Waiting (' + data.status + ')...';
      if (data.jobs_on_server) {
        status += '<br />' + data.jobs_on_server + ' jobs on the server';
      }
      uploader.innerHTML = '<div class="du-info">' + status + '</div>';
      break;
    case 'done':
      uploader.innerHTML = '<div class="du-info">Open the zoomable viewer at<br />' +
              '<a href="' + data.url + '">' + data.url + '</a></div>';
      clearInterval(statusPollId);
      break;
    case 'failed':
      uploader.innerHTML = '<div class="du-info">Something went wrong when converting the file.<br />' +
              'Please, make sure you are uploading a valid file and try again.</div>';
      clearInterval(statusPollId);
      break;
  }
}

function du_cb(status, result, du) {
  if (status == 'init') {
    ga('send', 'event', 'Try', 'upload_init');
    du_instance = du;
    du_instance.setHook('beforeupload', onbeforeupload);
  } else if (status == 'started') {
    ga('send', 'event', 'Try', 'upload_started');
  } else if (status == 'done') {
    ga('send', 'event', 'Try', 'upload_done');
    var baseStatusUrl = 'http://test.iiifhosting.com/tasks/' + task_id + '/?callback=status_cb';
    var statusUrl = baseStatusUrl;
    statusPollId = setInterval(function () {
      var old = document.querySelector('script[src="' + statusUrl + '"]');
      if (old && old.parentNode) {
        old.parentNode.removeChild(old);
      }

      statusUrl = baseStatusUrl + '&random=' + Math.random();

      var script = document.createElement('script');
      script.src = statusUrl;

      document.getElementsByTagName('head')[0].appendChild(script);
    }, 1000);
    uploader.innerHTML = '<div class="du-info">Waiting...</div>';
  } else if (status == 'error') {
    alert('Error uploading the files!');
  }
}