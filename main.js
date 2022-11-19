// @ts-check <script>
status = 'script start...';
function catchREST() {

  /** @param {Function} fn */
  function getFunctionCommentContent(fn) {
    return (fn + '').replace(getFunctionCommentContent.regex_functionShape, getFunctionCommentContent.takeContent);
  }
  getFunctionCommentContent.takeContent = function (whole, lead, content, tail) { return trimEnd(content); };
  getFunctionCommentContent.regex_functionShape = /^([\s\S\n\r]*\/\*\s*)([\s\S\n\r]*)(\s*\*\/[\s\r\n]*}[\s\r\n]*)$/;

  /** @param {string | null | undefined} str */
  function trimEnd(str) {
    if (str == null) return '';
    return String(str).replace(trimEnd.regex_trailWS, '');
  }
  trimEnd.regex_trailWS = /[\r\n\s]+$/;

  /** @param {string} queryString */
  function unmangleFromQueryString(queryString) {
    var pairs = queryString.split('&');
    var result = {};
    for (var i = 0; i < pairs.length; i++) {
      var posEq = pairs[i].indexOf('=');
      var key = pairs[i].slice(0, Math.max(0, posEq));
      var value = posEq < 0 ? '' : pairs[i].slice(posEq + 1);
      switch (key.toLowerCase()) {
        case 'get':
          result.verb = 'GET';
          if (!result.url && value) result.url = value;
          continue;

        case 'post':
          result.verb = 'POST';
          if (posEq > 0) result.body = value;
          continue;

        case 'put':
          result.verb = 'PUT';
          if (posEq > 0) result.body = value;
          continue;

        case 'body':
          result.body = value;
          continue;

        case 'verb':
          result.verb = value;
          continue;
        
        case 'url':
          result.url = value;
          continue;

        default:
          if (posEq > 0) {
            if (!result.headers) result.headers = {};
            result.headers[key] = value;
          }
      }
    }

    return result;
  }


  function getTimeNow() {
    if (typeof Date.now === 'function') return Date.now();
    return +new Date();
  }

  function runBrowser() {
    status = 'runBrowser...';
    // TODO: remove spurious injected scripts

    var layout = bindLayout();
    /** @type {import('codemirror').CodeMirror} */
    var requestCodeMirror;
    /** @type {import('codemirror').CodeMirror} */
    var responseCodeMirror;

    makeSplitterDraggable();

    // @ts-ignore CodeMirror
    if (typeof CodeMirror === 'function') {
      withDependenciesLoaded();
    } else {
      catchREST.withDependenciesLoaded = withDependenciesLoaded;
    }

    function withDependenciesLoaded() {
      catchREST.withDependenciesLoaded = null;
      status = 'withDependenciesLoaded...';
      createCodeMirrors();

      function createCodeMirrors() {
        // @ts-ignore CodeMirror is defined
        var CodeMirrorCtor = CodeMirror;
        var locationText = 'deriveTextFromLocation();';
        //updateSendLabel(locationText);
        requestCodeMirror = CodeMirrorCtor(layout.requestTD,
          {
            lineNumbers: true,
            value: locationText,
            extraKeys: {
              'Ctrl-Enter': sendRequestInteractively,
              'Cmd-Enter': sendRequestInteractively,
            },
            lineWrapping: true,
            autofocus: true
          });
        var locationTextFirstLineLength = locationText.indexOf('\n') || locationText.length;
        requestCodeMirror.setCursor(0, locationTextFirstLineLength);
        responseCodeMirror = CodeMirrorCtor(layout.responseTD,
          {
            lineNumbers: true,
            lineWrapping: true,
            readOnly: true
          });

        requestCodeMirror.on('changes', requestTextChanged);
        requestTextChanged.timeout = null;

        function sendRequestInteractively() {

        }

        function requestTextChanged() {

        }
      }
    }

    function set(elem, value) {
      if (typeof value === 'string') {
        if (elem && 'textContent' in elem) {
          elem.textContent = value;
        } else if (elem && 'innerText' in elem) {
          elem.innerText = value;
        } else {
          elem.text = value;
        }
      }
    }

    function bindLayout() {
      var anyMissing = false;
      var elems = {
        layoutTABLE: /**@type {HTMLTableElement}*/(id('layoutTABLE')),
        leftTD: /**@type {HTMLTableElement}*/(id('leftTD')),
        sendBUTTON: /**@type {HTMLButtonElement}*/(id('sendBUTTON')),
        sendLabel: /**@type {HTMLSpanElement}*/(id('sendLabel')),
        requestTD: /**@type {HTMLTableCellElement}*/(id('requestTD')),
        splitterTD: /**@type {HTMLTableCellElement}*/(id('splitterTD')),
        splitterLabel: /**@type {HTMLSpanElement}*/(id('splitterLabel')),
        responseTD: /**@type {HTMLTableCellElement}*/(id('responseTD')),
        statusTD: /**@type {HTMLTableCellElement}*/(id('statusTD')),
        anyMissing: anyMissing
      };
      return elems;

      function id(id) {
        var elem = document.getElementById(id);
        if (!elem) anyMissing = true;
        return elem;
      }
    }

    function makeSplitterDraggable() {
      restoreSplitterPosition();

      layout.splitterTD.onmousedown = splitterTD_onmousedown;
      layout.splitterTD.ontouchstart = splitterTD_onmousedown;
      layout.splitterTD.ontouchend = splitterTD_onmouseup;
      layout.splitterTD.onmouseup = splitterTD_onmouseup;
      layout.splitterTD.onmousemove = splitterTD_onmousemove;
      window.onmousemove = splitterTD_onmousemove;
      window.ontouchmove = splitterTD_onmousemove;
      window.onmouseup = splitterTD_onmouseup

      /** @type {boolean} */
      var splitterTD_mice;

      /**
       * @param {{ button?: number }} evt
       * @param {boolean} down
       */
      function updateMice(evt, down) {
        if (evt.button) down = false;
        splitterTD_mice = down;

        if (splitterTD_mice) {
          if (!/(\s+|^)down(\s+|$)/.test(layout.splitterTD.className || '')) layout.splitterTD.className += ' down';
        } else {
          if (/(\s+|^)down(\s+|$)/.test(layout.splitterTD.className || '')) layout.splitterTD.className = (layout.splitterTD.className || '').replace(/(\s+|^)down(\s+|$)/g, '');
        }
      }


      /** @param {Event & Partial<MouseEvent>} evt */
      function splitterTD_onmousedown(evt) {
        updateMice(evt, true);
      }

      /** @param {Event & Partial<MouseEvent>} evt */
      function splitterTD_onmouseup(evt) {
        updateMice(evt, false);
      }

      /** @param {MouseEvent | TouchEvent} evt */
      function splitterTD_onmousemove(evt) {
        if (splitterTD_mice) {
          if (typeof evt.preventDefault === 'function') evt.preventDefault();

          var y =
          /** @type {MouseEvent} */(evt).pageY ||
          /** @type {MouseEvent} */(evt).y;

          if (!y) {
            var touches = /** @type {TouchEvent} */(evt).touches;
            if (touches && touches.length === 1)
              y = touches[0].pageY;
          }

          var ratio = y / (window.innerHeight - (layout.statusTD.offsetHeight || layout.statusTD.getBoundingClientRect().height));

          var ratioPercent = (ratio * 100).toFixed(2).replace(/0+$/, '') + '%';
          var reverseRatioPercent = (100 - ratio * 100).toFixed(2).replace(/0+$/, '') + '%';
          if (typeof JSON !== 'undefined' && JSON && typeof JSON.stringify === 'function') {
            window.name = '{"splitter": "' + ratioPercent + '"}';
          }

          if (layout.requestTD.height !== ratioPercent) layout.requestTD.height = ratioPercent;
          if (layout.responseTD.height !== reverseRatioPercent) layout.responseTD.height = reverseRatioPercent;
        }
      }

      function restoreSplitterPosition() {
        if (!window.name || typeof JSON === 'undefined' || !JSON || typeof JSON.parse !== 'function') return;
        try {
          var windowObj = JSON.parse(window.name);
          if (windowObj && windowObj.splitter && /%$/.test(windowObj.splitter)) {
            var num = Number(windowObj.splitter.replace(/%$/, ''));
            if (num > 0 && num < 100) {
              layout.requestTD.height = windowObj.splitter;
              layout.responseTD.height = (100 - num) + '%';
            }
          }
        } catch (err) {
          try { console.error('cannot restore splitter position: ', err); } catch (err) { }
        }
      }
    }
  }

  /**
   * @param {boolean=} asModule
   */
  function runNode(asModule) {

    function runAsModule() {

    }

    function build() {
      var fs = require('fs');
      var path = require('path');

      var imports = [
        'codemirror/lib/codemirror.js',
        'codemirror/lib/codemirror.css',

        'typescript/lib/typescript.js',
        // include lib.d.ts here? probably no

        'xlsx/dist/xlsx.full.min.js',
        //'xlsx/jszip.js'
      ];

      var combinedJS = '';

      for (var im of imports) {
        var scriptFilePath = path.resolve(__dirname, 'node_modules', im);
        var content = fs.readFileSync(scriptFilePath, 'utf8');
        console.log(im + ' [' + content.length + ']');
        switch (path.extname(im).toLowerCase()) {
          case ".js": {
            content = strictES3(scriptFilePath, content);
            combinedJS += (combinedJS ? '\n' : '') + '// #region ' + path.basename(im).replace(/\.js$/, '') + '\n' + content + '\n' + '// #endregion';
            break;
          }
          case '.css': {
            combinedJS += (combinedJS ? '\n' : '') + '///// ' + path.basename(im) + ' /////\n' +
              '(function() { var style = document.createElement("style");\n' +
              'style.innerHTML = ' + JSON.stringify(content) + ';\n' +
              '(document.body || document.getElementsByTagName("head")[0]).appendChild(style); })();\n';
          }
        }
      }

      combinedJS += '\n\nif (typeof catchREST !== "undefined" && catchREST && typeof catchREST.withDependenciesLoaded === "function") catchREST.withDependenciesLoaded();\n';

      console.log('combined[' + combinedJS.length + ']');
      fs.writeFileSync(path.resolve(__dirname, 'lib/combined.js'), combinedJS);
      console.log('written [' + combinedJS.length + '] to ' + path.resolve(__dirname, 'lib/combined.js'));

      /** @param {string} filePath @param {string} content */
      function strictES3(filePath, content) {
        var jscriptKeywords =
          ('break,false,in,this,void,continue,for,new,true,while,delete,' +
            'function,null,typeof,with,else,if,return,var,' +
            'catch,class,case,const,debugger,finally,declare,do,instanceof,default,extends,export,enum,' +
            'is,import,interface,super,throw,try,switch').split(',');

        var ts = require('typescript');
        var ast = ts.createLanguageServiceSourceFile(
          filePath,
          ts.ScriptSnapshot.fromString(content),
          ts.ScriptTarget.ES3,
          '1',
          true,
          ts.ScriptKind.JS);

        var replacements = [];
        var replacementCount = 0;

        ts.forEachChild(ast, visitNode);

        if (replacements.length) {
          replacements.sort(function (r1, r2) { return r1.pos - r2.pos });
          var updatedContent = '';
          var lastPos = 0;
          for (let i = 0; i < replacements.length; i++) {
            var repl = replacements[i];
            if (repl.pos > lastPos) updatedContent += content.slice(lastPos, repl.pos);
            updatedContent += repl.text;
            lastPos = repl.pos + repl.length;
          }

          if (lastPos < content.length) {
            updatedContent += content.slice(lastPos);
            lastPos = content.length;
          }

          console.log(' handled ' + replacementCount + ' replacements');
          content = updatedContent;
        }

        return content;

        /** @param {import('typescript').Node} node */
        function visitNode(node) {
          switch (node.kind) {
            case ts.SyntaxKind.PropertyAccessExpression:
              var propAccess = /** @type {import('typescript').PropertyAccessExpression} */(node);
              if (propAccess.name.kind === ts.SyntaxKind.Identifier
                && jscriptKeywords.indexOf(propAccess.name.text) >= 0) {
                var kw = propAccess.name;
                var posDot = content.lastIndexOf('.', kw.pos);
                replacements.push({ pos: posDot, length: 1, text: '[' });
                replacements.push({ pos: kw.pos + kw.getLeadingTriviaWidth(), length: kw.text.length, text: '"' + kw.text + '"]' });
                replacementCount++;
              }
              break;

            case ts.SyntaxKind.PropertyAssignment:
              var propAssig = /** @type {import('typescript').PropertyAssignment} */(node);
              if (propAssig.name.kind === ts.SyntaxKind.Identifier
                && jscriptKeywords.indexOf(propAssig.name.text) >= 0) {
                var kw = propAssig.name;
                replacements.push({ pos: kw.pos + kw.getLeadingTriviaWidth(), length: kw.text.length, text: '"' + kw.text + '"' });
                replacementCount++;
              }
              break;

            case ts.SyntaxKind.ObjectLiteralExpression:
              var objLit = /** @type {import('typescript').ObjectLiteralExpression} */(node);
              if (objLit.properties.hasTrailingComma) {
                var ln = ast.getLineAndCharacterOfPosition(objLit.pos).line;
                if (ln > 740 && ln < 760 || true) {
                  var copy = {};
                  for (var k in objLit.properties) {
                    if (String(Number(k)) === k) continue;
                    copy[k] = objLit.properties[k];
                  }

                  var lastTok = objLit.getLastToken();
                  if (lastTok && content.slice(lastTok.pos - 1, lastTok.pos) === ',') {
                    replacements.push({
                      pos: lastTok.pos - 1,
                      length: 1,
                      text: ''
                    });

                    replacementCount++;
                  }
                }
              }
              break;
            
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
              var getSetAcc = /** @type {import('typescript').GetAccessorDeclaration} */(node);
              replacements.push({
                pos: getSetAcc.pos + getSetAcc.getLeadingTriviaWidth(),
                length: getSetAcc.name.pos - (getSetAcc.pos + getSetAcc.getLeadingTriviaWidth()),
                text: ''
              });
              replacements.push({
                pos: getSetAcc.name.end,
                length: 0,
                text: ': function'
              });
              break;
          }

          ts.forEachChild(node, visitNode);
        }

      }
    }

    function runAsServer() {
      build();

      var catchREST_secret_variable_name = 'catchREST_secret';

      /** @typedef {import("http").IncomingMessage} HTTPRequest */
      /** @typedef {import("http").ServerResponse} HTTPResponse */
      var port = derivePort(__dirname.toLowerCase());
      /** @type{typeof import('url')} */
      var URL;

      /** @type {(() => void | (Promise<void>))[]} */
      var shutdownServices = [];
      var runningChildProcesses = [];

      var shared_process_secret = /** @type {string} */(process.env[catchREST_secret_variable_name]);
      if (!shared_process_secret) {
        shared_process_secret = port + '-' + Math.random().toString(36).replace(/[\.+-,]/g, '') + '-' + Math.random().toString(36).replace(/[\.+-,]/g, '');
      }


      if (process.env[catchREST_secret_variable_name]) {
        process.stdout.write('Catch REST~' + process.pid);
        return requestShutdown().then(function () {
          // response may come before server is down and HTTP port fully released
          setTimeout(function () {
            createServerAndContinue();
          }, 100);
        });
      } else {
        process.stdout.write('Catch REST[' + process.pid + ']');
        return createServerAndContinue();
      }

      function requestShutdown() {
        return new Promise(function (resolve, reject) {
          var http = require('http');
          var requestUrl = 'http://localhost:' + port + '/control?' + catchREST_secret_variable_name + '=' + shared_process_secret + '&command=shutdown';
          var httpReq = http.request(requestUrl, { method: 'POST' });
          var data = '';
          httpReq.on('data', function (chunk) {
            data += chunk;
          });
          httpReq.on('close', function () {
            resolve(data);
          });
          httpReq.on('error', function (error) {
            resolve(error);
          });
          httpReq.end();
        });
      }

      function createServerAndContinue() {
        var errorCount = 0;
        return createServer(port, handleRequest).then(
          handleServerCreated,
          handleCreateServerError
        );

        function handleServerCreated(server) {
          shutdownServices.push(function () {
            return /** @type {Promise<void>} */(new Promise(function (resolve, reject) {
              server.close(function (error) {
                if (error) reject(error);
                else resolve();
              });
            }));
          });

          process.stdout.write(' ' + 'http://localhost:' + port);
          watchSelf();
          process.stdout.write('\n');
        }

        function handleCreateServerError(createServerError) {
          errorCount++;
          if (errorCount >= 10) {
            process.stdout.write(createServerError.message);
            throw createServerError;
          }

          process.stdout.write('.');

          return createServer(port, handleRequest).then(
            handleServerCreated,
            handleCreateServerError
          );
        }
      }

      function watchSelf() {
        var fs = require('fs');
        var changeDebounceTimeout;
        var watcher = fs.watch(__filename, function () {
          clearTimeout(changeDebounceTimeout);
          changeDebounceTimeout = setTimeout(checkAndTriggerRestart, 200);
        });
        shutdownServices.push(function () {
          watcher.close();
        });

        function checkAndTriggerRestart() {
          var currentContent = fs.readFileSync(__filename, "utf8");
          if (currentContent.indexOf(catchREST + '') < 0) {
            // TODO: log stdio restart due to file change
            startNewInstance();
          }
        }
      }

      /**
       * @param {HTTPRequest} req
       * @param {HTTPResponse} res
       */
      function handleRequest(req, res) {
        if (!URL) URL = require('url');

        var url = URL.parse(/** @type {string} */(req.url), true /*parseQueryString*/);
        process.stdout.write(
          '  ' +
          (process.env[catchREST_secret_variable_name] ? '~' + process.pid : '[' + process.pid + ']') +
          req.method + url.pathname);
        switch (url.pathname?.toLowerCase()) {
          case '/':
          case '/index.html':
            return handleLocalFileRequest(__dirname + '/index.html', res);

          case 'favicon.ico':
            return handleFaviconRequest(req, res);

          case '/control':
            return handleControlRequest(req, res, url);

          default:
            return handleLocalFileRequest(__dirname + '/' + (req.url || '').replace(/^\/+/, '') , res);
        }
      }

      /**
       * @param {string} filePath
       * @param {HTTPResponse} res
       */
      function handleLocalFileRequest(filePath, res) {
        // TODO: inject ETag for caching
        res.setHeader('Content-type', 'text/html');
        var fs = require('fs');
        fs.readFile(filePath, function (err, data) {
          if (err) {
            res.statusCode = 404;
            console.log(' ' + (res.statusMessage = err.code || err.message || String(err)));
            res.end();
          } else {
            res.end(data);
            console.log(' [' + data.length + ']');
          }
        });
      }

      /**
       * @param {HTTPRequest} req
       * @param {HTTPResponse} res
       */
      function handleFaviconRequest(req, res) {
        // for now just skip
        res.end();
        console.log(' []');
      }

      /**
       * @param {HTTPRequest} req
       * @param {HTTPResponse} res
       */
      function handle404Request(req, res) {
        res.statusCode = 404;
        res.end(req.url + ' NOT FOUND.');
      }

      /**
       * @param {import("http").IncomingMessage} req
       * @param {import("http").ServerResponse} res
       * @param {import("url").UrlWithParsedQuery} url
       */
      function handleControlRequest(req, res, url) {
        if (url.query[catchREST_secret_variable_name] !== shared_process_secret)
          return handle404Request(req, res);

        switch (url.query.command) {
          case 'shutdown':
            res.end('OK');
            if (process.env[catchREST_secret_variable_name]) {
              process.exit(0);
            } else {
              shutdownServices.map(function (shtd) { return shtd(); });
              shutdownServices = [];
            }
            return;

          case 'restart':
            res.end('starting new instance');
            startNewInstance();
            return;
        }
      }

      function startNewInstance() {
        if (startNewInstance.current) return startNewInstance.current;

        return startNewInstance.current = new Promise(function (resolve, reject) {

          setTimeout(function () {
            startNewInstance.current = null;
          }, 1000);

          if (process.env[catchREST_secret_variable_name] && process.send) {
            process.send({
              command: 'start'
            });

            return;
          }

          var child_process = require('child_process');
          /** @type{Record<string,string>} */
          var env = {};
          env[catchREST_secret_variable_name] = shared_process_secret;
          var proc = child_process.fork(
            __filename,
            process.argv[1].toLowerCase().indexOf(
              __filename.replace(/\\/g, '/').split('/').reverse()[0].toLowerCase()) >= 0 ?
                process.argv.slice(2) :
                process.argv.slice(1),
            {
              env: env,
              stdio: ['pipe', 'pipe', 'pipe', 'ipc']
            });

          if (proc.stdout) proc.stdout.on('data', handleChildStdout);
          if (proc.stderr) proc.stderr.on('data', handleChildStderr);
          proc.on('message', handleChildMessage);
          proc.on('error', handleError);
          proc.on('exit', handleExit);
          var counted = false;

          function handleChildStdout(data) {
            resolve();
            if (!counted) {
              counted = true;
              runningChildProcesses.push(proc);
            }

            var procId = proc.pid;
            process.stdout.write(data);
          }

          function handleChildStderr(data) {
            resolve();
            if (!counted) {
              counted = true;
              runningChildProcesses.push(proc);
            }

            var procId = proc.pid;
            process.stderr.write(data);
          }

          function handleError(error) {
            resolve(error);
            var procId = proc.pid;
          }

          function handleChildMessage(msg) {
            if (msg && msg.command === 'start') {
              startNewInstance();
            }
          }

          function handleExit(exitCode) {
            resolve(exitCode);

            var posCurrent = runningChildProcesses.indexOf(proc);
            if (posCurrent >=0) runningChildProcesses.splice(posCurrent, 1);

            // TODO: debounce with timeout, shutdown if no longer runningChildProcesses-
          }

        });
      }
      /** @type {null | Promise<void>} */
      startNewInstance.current = null;

      /**
       * @param {number} port
       * @param {(req: HTTPRequest, res:HTTPResponse) => void} handleRequest
       * @returns {Promise<import('http').Server>}
       */
      function createServer(port, handleRequest) {
        return new Promise(function (resolve, reject) {
          var http = require('http');
          var server = http.createServer(function (req, res) {
            handleRequest(req, res);
          });
          server.on('listening', function () {
            resolve(server);
          });
          server.on('error', function (error) {
            reject(error);
          });
          server.listen(port, '0.0.0.0');
        });
      }
    }

    function runAsTests() {
      runTests(
        function (text) { console.log(text); },
        function (describe, it) {
          tests(describe, it);
          nodeTests(describe, it);
        }
      );
    }

    function derivePort(str) {
      str = String(str);
      var val = Math.PI;
      for (var i = 0; i < str.length; i++) {
        val = Math.pow(10, val + str.charCodeAt(i) / 97);
        val = val - Math.floor(val);
      }
      return Math.floor(val * 3000) + 4000;
    }

    /**
     * @param {(name: string, body: Function) => void} describe
     * @param {(name: string, body: Function) => void} it
     */
    function nodeTests(describe, it) {
    }

    if (asModule) return runAsModule();
    else if (process.argv.filter(function (arg) { return arg === '--test' || arg === '/test'; }).length) return runAsTests();
    else return runAsServer();
  }

  function runWScript() {
    // TODO: look for node.js, and if it's not there pop an IE window suggesting download
    WScript.Echo('Catch REST is unable to run in WSH mode. Install node.js and run Catch REST inside of it.');
  }

  /**
   * @param {(name: string, body: Function) => void} describe
   * @param {(name: string, body: Function) => void} it
   */
  function tests(describe, it) {
    describe('unmangleFromQueryString', function () {
      var data = {
        '': {},
        'post=none': { verb: 'POST', body: 'none' },
        'put=none': { verb: 'PUT', body: 'none' },
        'url=some': { url: 'some' }
      };
      for (var queryString in data) {
        setTest(queryString, data[queryString]);
      }

      function setTest(queryString, data) {
        var expected = JSON.stringify(data);
        it(JSON.stringify(queryString) + ' --> ' + expected, function () {
          var actual = JSON.stringify(unmangleFromQueryString(queryString));
          if (actual !== expected) throw new Error('mismatch:\n' + actual + ' instead of expected\n' + expected);
        });
      }
    });

    describe('trimEnd', function () {
      it('null --> ""', function () {
        if (trimEnd(null) !== '') throw new Error('"' + trimEnd(null) + '"');
      });

      it('undefined --> ""', function () {
        if (trimEnd(void 0) !== '') throw new Error('"' + trimEnd(void 0) + '"');
      });

      it('"" --> ""', function () {
        if (trimEnd('') !== '') throw new Error('"' + trimEnd('') + '"');
      });

      it('"a\\n " --> "a"', function () {
        if (trimEnd('a\n ') !== 'a') throw new Error('"' + trimEnd('a\n ') + '"');
      });
    });

    describe('getFunctionCommentContent', function () {
      it('named function', function () {
        if (getFunctionCommentContent(myFn) !== 'comment') throw new Error(myFn + ' resulted in "' + getFunctionCommentContent(myFn) + '"');
        function myFn() { /* comment */}
      });

      it('unnamed function', function () {
        var fn = function () { /* comment ABC*/ };
        var str = getFunctionCommentContent(fn);
        if (str !== 'comment ABC') throw new Error(fn + ' resulted in "' + str + '"');
      });

      it('multiline function', function () {
        if (getFunctionCommentContent(myFn) !== 'comment\nvery important') throw new Error(myFn + ' resulted in "' + getFunctionCommentContent(myFn) + '"');
        function myFn() {
          /*
comment
very important
          */
        }
      });
    });
  }

  function detectEnvironmentAndStart() {
    status = 'detectEnvironmentAndStart...';
    status = 'detectEnvironmentAndStart: ' + detectEnvironment() + '...';

    switch (detectEnvironment()) {
      case 'browser': return runBrowser();
      case 'node-script': return runNode(false /* asModule */);
      case 'node-module': return runNode(true /* asModule */);
      case 'wscript': return runWScript();
    }

    throw new Error('Running in an unsupported environment.');

    function detectEnvironment() {
      if (typeof window !== 'undefined' && window && typeof window.alert === 'function'
        && typeof document !== 'undefined' && document && typeof document.createElement === 'function')
        return 'browser';
      
      // TODO: detect worker in browser

      if (typeof process !== 'undefined' && process && process.argv && typeof process.argv.length === 'number'
        && typeof require === 'function' && typeof require.resolve === 'function'
        && typeof module !== 'undefined' && module)
        if ((process.mainModule || require.main) === module)
          return 'node-script';
        else
          return 'node-module';
      
      if (typeof WScript !== 'undefined' && WScript && !!WScript.ScriptFullName) return 'wscript';

      // TODO: detect apple script inside shell?
    }
  }


  status = 'catchREST...';
  detectEnvironmentAndStart();
}
status = 'nearly catchREST()...';
catchREST(); //</script>
