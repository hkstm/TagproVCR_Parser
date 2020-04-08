// ==UserScript==
// @name          TagPro Analytics
// @version       3.2
// @author        Ronding
// @description   Gameplay data recorder and uploader for TagPro (see tagpro.eu)
// @namespace     http://tagpro.eu
// @downloadURL   https://tagpro.eu/userscript.user.js
// @include       https://tagpro.eu/
// @include       https://tagpro.eu/*
// @include       https://tagpro.koalabeast.com/
// @include       https://tagpro.koalabeast.com/*
// @include       http://tagpro-*.koalabeast.com/
// @include       http://tagpro-*.koalabeast.com/*
// @include       http://tagpro-*.koalabeast.com:*
// @include       http://tangent.jukejuice.com/
// @include       http://tangent.jukejuice.com/*
// @include       http://tangent.jukejuice.com:*
// @include       http://*.newcompte.fr/
// @include       http://*.newcompte.fr/*
// @include       http://*.newcompte.fr:*
// @grant         GM_getValue
// @grant         GM_setValue
// ==/UserScript==

// Copyright (c) 2019, Jeroen van der Gun
// All rights reserved.
//
// Use in source and binary forms, without modification, is permitted. Redistribution is not
// permitted.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
// OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
// TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

(function(){
var script = document.createElement('script');
script.textContent = 'window.tagproAnalytics=' + GM_getValue('TagProAnalytics', '{}') + ';(' + function(){

// begin unprivileged client

if(location.hostname == 'tagpro.eu')
 tagproAnalyticsCallback();

else if(location.port || location.pathname == '/game')
{
 if(window.tagproAnalytics.collector)
 {
  var script = document.createElement('script');
  script.textContent = window.tagproAnalytics.collector;
  document.body.appendChild(script);
  document.body.removeChild(script);
 }
 var stats = document.getElementById('stats');
 var div1 = document.createElement('div');
 div1.style.margin = '0 0 .8em';
 div1.style.display = 'table';
 div1.style.width = '100%';
 div1.style.height = '1.45em';
 var div2 = document.createElement('div');
 div2.style.display = 'table-row';
 var status = document.createElement('span');
 status.style.display = 'table-cell';
 status.style.verticalAlign = 'top';
 status.textContent = 'No Analytics data collector available.';
 div2.appendChild(status);
 div1.appendChild(div2);
 stats.parentNode.insertBefore(div1, stats.nextSibling);
 window.tagproAnalyticsListener = function()
 {
  switch(window.tagproAnalyticsCollector.status)
  {
   case 'initialized':
    status.textContent = 'Analytics waiting for game data...';
    break;
   case 'preGame':
    status.textContent = 'Analytics will record this match.';
    break;
   case 'inGame':
    status.textContent = window.tagproAnalyticsCollector.recording ? 'Analytics is recording.' : 'Analytics is idle.';
    break;
   case 'postGame':
    if(window.tagproAnalyticsCollector.upload || window.tagproAnalyticsCollector.recording)
    {
     if(window.tagproAnalyticsCollector.upload)
     {
      status.style.paddingRight = '2em';
      status.textContent = window.tagproAnalyticsCollector.recording ? 'Uploading match to tagpro.eu...' : 'Checking tagpro.eu for match...';
      var progress = document.createElement('div');
      progress.style.display = 'table-cell';
      progress.style.verticalAlign = 'top';
      progress.style.width = '6em';
      var a = document.createElement('a');
      a.style.display = 'block';
      a.style.height = '1.4em';
      a.style.textAlign = 'center';
      a.style.fontWeight = 'bold';
      a.style.border = '1px solid #000';
      a.style.borderRadius = '3px';
      a.style.backgroundColor = 'rgba(64,64,64,.8)';
      a.textContent = '\u25CF\u25CB';
      progress.appendChild(a);
      div2.appendChild(progress);
      var spinner = setInterval(function()
      {
       a.textContent = a.textContent[1] + a.textContent[0];
      }, 500);
     }
     else
      status.textContent = 'Analytics aborted recording due to a connection loss.';
     var json = JSON.stringify(window.tagproAnalyticsCollector.data);
     var submit = JSON.parse(json);
     json = encodeURIComponent(json);
     if(!window.tagproAnalytics.secret)
     {
      var secret = new Uint8Array(8);
      crypto.getRandomValues(secret);
      window.tagproAnalytics.secret = btoa(String.fromCharCode.apply(null, secret));
     }
     if(window.tagproAnalytics.matches)
     {
      window.tagproAnalytics.matches.splice(19);
      window.tagproAnalytics.matches.unshift(submit);
     }
     else
      window.tagproAnalytics.matches = [submit];
     document.body.dataset.tagproAnalytics = JSON.stringify(window.tagproAnalytics);
     if(window.tagproAnalyticsCollector.upload)
     {
      var send = function()
      {
       var xhr = new XMLHttpRequest();
       xhr.open('POST', 'https://tagpro.eu/submit/');
       xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
       xhr.onreadystatechange = function()
       {
        if(xhr.readyState == 4)
        {
         clearInterval(spinner);
         if(xhr.status == 202)
         {
          a.textContent = '#' + xhr.responseText.substr(7);
          if(submit.group)
           a.target = '_blank';
          a.href = 'https://tagpro.eu/' + xhr.responseText;
          status.textContent = window.tagproAnalyticsCollector.recording ? 'Match uploaded to tagpro.eu.' : 'Match found on tagpro.eu.';
          submit.upload = xhr.responseText;
          document.body.dataset.tagproAnalytics = JSON.stringify(window.tagproAnalytics);
         }
         else if(window.tagproAnalyticsCollector.recording)
         {
          a.textContent = 'JSON';
          a.href = 'data:application/octet-stream,' + json;
          status.textContent = (xhr.responseText ? xhr.responseText : 'Unknown error uploading match to tagpro.eu') + '; match available locally.';
         }
         else
         {
          a.textContent = 'N/A';
          if(submit.group)
           a.target = '_blank';
          a.href = 'https://tagpro.eu/?search=server&name=' + encodeURIComponent(submit.server);
          status.textContent = (xhr.status == 204 ? 'Match not found on tagpro.eu' : xhr.responseText ? xhr.responseText : 'Unknown error checking tagpro.eu for match') + '.';
         }
        }
       };
       xhr.send('data=' + json + '&clock=' + (Date.now() / 1000 >>> 0) + '&secret=' + encodeURIComponent(window.tagproAnalytics.secret) + '&version=12');
      };
      if(window.tagproAnalyticsCollector.recording)
       send();
      else
       setTimeout(send, 5000);
     }
    }
    else
     status.textContent = 'Analytics did not register this match.';
  }
 };
 if(window.tagproAnalyticsCollector)
  window.tagproAnalyticsListener();
}

else
{
 var a = document.createElement('a');
 a.href = 'https://tagpro.eu';
 a.textContent = 'Analytics';
 var nav = document.getElementById('site-nav');
 if(nav)
 {
  var li = document.createElement('li');
  li.appendChild(a);
  nav.getElementsByTagName('ul')[0].appendChild(li);
 }
 else if(location.pathname == '/')
 {
  var div = document.getElementsByClassName('section smaller')[0];
  a.style.marginRight = '10px';
  a.style.marginLeft = '10px';
  div.insertBefore(a, div.firstChild);
 }
 if(location.pathname == '/games/find')
 {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://tagpro.eu/collector.js');
  xhr.onreadystatechange = function()
  {
   if(xhr.readyState == 4 && xhr.status == 200 && xhr.responseText && window.tagproAnalytics.collector != xhr.responseText)
   {
    window.tagproAnalytics.collector = xhr.responseText;
    document.body.dataset.tagproAnalytics = JSON.stringify(window.tagproAnalytics);
   }
  };
  xhr.send();
 }
 else if(location.pathname == '/boards')
 {
  nav = document.getElementsByClassName('leaderboard-menu');
  if(nav.length)
  {
   li = document.createElement('li');
   li.addEventListener('click', function()
   {
    location.href = 'https://tagpro.eu/?players';
   });
   li.textContent = 'Tagpro.eu';
   nav[0].getElementsByTagName('ul')[0].appendChild(li);
  }
 }
 else if(location.pathname == '/maps')
 {
  nav = document.getElementsByClassName('tab-list');
  if(nav.length)
  {
   li = document.createElement('li');
   li.addEventListener('click', function()
   {
    location.href = 'https://tagpro.eu/?maps';
   });
   a = document.createElement('a');
   a.textContent = 'Tagpro.eu';
   li.appendChild(a);
   nav[0].appendChild(li);
  }
 }
 else
 {
  nav = document.getElementsByClassName('profile-name');
  if(nav.length)
  {
   var exit = document.getElementsByClassName('profile-exit')[0];
   var query = encodeURIComponent(nav[0].textContent.trim());
   a = document.createElement('a');
   a.href = 'https://tagpro.eu/?search=player-verified&name=' + query;
   a.className = 'btn btn-default';
   a.textContent = 'Tagpro.eu Matches';
   exit.insertBefore(a, exit.firstChild);
   exit.insertBefore(document.createTextNode(' '), exit.firstChild);
   a = document.createElement('a');
   a.href = 'https://tagpro.eu/?player=' + query;
   a.className = 'btn btn-default';
   a.textContent = 'Tagpro.eu Profile';
   exit.insertBefore(a, exit.firstChild);
   exit.insertBefore(document.createTextNode(' '), exit.firstChild);
  }
 }
}

// end unprivileged client

} + ')();';
document.body.appendChild(script);
document.body.removeChild(script);

window.addEventListener('beforeunload', function()
{
 var hidden = document.body.dataset.tagproAnalytics;
 if(hidden) GM_setValue('TagProAnalytics', JSON.stringify(JSON.parse(hidden)));
});

})();
