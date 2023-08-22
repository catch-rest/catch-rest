// @ts-check <script>
function catchREST() {

  addFly();

  function addFly() {
    var fly = document.getElementById('catchREST_fly');
    if (fly) fly.parentElement.removeChild(fly);
    fly = document.createElement('div');
    fly.id = 'catchREST_fly';
    fly.style.cssText='position:fixed; right:1em;top:1em;padding:0.3em; background:black;color:white;border:gray 1px silver;box-shadow:1px 1px 4px white;border-radius:100%; z-index:1000000;cursor:default;';
    fly.innerHTML = 'B,I,acute,grave,macron,cursive,fractur,super,plate,round,typewriter,wide,bookmark';
    fly.onmousedown = function (e) {
      if (e.button) {
        e.preventDefault();
        var bkmLink = 'javascript:' + bkm(catchREST, true) + ' catchREST()';
        console.log(bkmLink);
        if (typeof Blob === 'function' && typeof ClipboardItem === 'function') {
          var blob = new Blob([bkmLink], { type: 'text/plain' });
          var item = new ClipboardItem({ 'text/plain': blob });
          navigator.clipboard.write([item]);
        } else {
          navigator.clipboard.write([bkmLink]);
        }
        setTimeout(function () { alert('copied to clipboard'); }, 500);
      } else {
        alert('fly');
      }
    };
    fly.onclick = function (e) {
      e.preventDefault();
    };
    document.body.appendChild(fly);
  }

  function bkm(code, forwardOnly) {code = code+'';
    if (/[\r\n]/.test(code)) return code.replace(/((\/\*)([\s\S\n\r]*?)(\*\/))|((\/\/)([^\n\r]*))|(\s+)/g,
      function (whole, cmSpan, cmSLead, cmSInner, cmSTrail, cmLine, cmLLead, cmLInner, space) {
        if (cmSpan) return cmSpan.replace(/\n/g, '\\n');
        if (cmLine) return '/*' + cmLLead + cmLInner + '*/';
        if (space) return space.replace(/\n/g, '/' + '*\\n*/').replace(/\r/g, '/' + '*\\r*/');
        return whole;
      });
    else if (forwardOnly) return code;
    else return code
      .replace(/(\/\*)([\s\S\n\r]*?)(\*\/)/g, function(whole,cmLead,cmInner,cmTrail) {
        if(cmInner==='\\n') return '\n';
        if(cmInner==='\\r') return '\r';
        if(cmInner.indexOf('/\/')==0) return cmInner;
        return cmLead + cmInner.replace(/\\n/g,'\n').replace(/\\r/g,'\r') + cmTrail;
      });
  }
} catchREST(); // </script>
