/*
 *
 * NOTE: The client side of hack.chat is currently in development,
 * a new, more modern but still minimal version will be released
 * soon. As a result of this, the current code has been deprecated
 * and will not actively be updated.
 *
*/
var clientversion='lmc-1.0-dev';
//select "chatinput" on "/"
document.addEventListener("keydown", e => {
	if (e.key === '/' && document.getElementById("chatinput") != document.activeElement) {
		e.preventDefault();
		document.getElementById("chatinput").focus();
	}
});

// initialize markdown engine
var markdownOptions = {
	html: false,
	xhtmlOut: false,
	breaks: true,
	langPrefix: '',
	linkify: true,
	linkTarget: '_blank" rel="noreferrer',
	typographer: true,
	quotes: `""''`,

	doHighlight: true,
	highlight: function (str, lang) {
		if (!markdownOptions.doHighlight || !window.hljs) { return ''; }

		if (lang && hljs.getLanguage(lang)) {
			try {
				return hljs.highlight(lang, str).value;
			} catch (__) { }
		}

		try {
			return hljs.highlightAuto(str).value;
		} catch (__) { }

		return '';
	}
};

var md = new Remarkable('full', markdownOptions);

// image handler
var allowImages = false;
//图片白名单
var imgHostWhitelist = [
	//hack.chat自带
	'i.imgur.com',
	'imgur.com',
	//cmd：下面的是复制的zhc（被打
	'i.loli.net', 's2.loli.net', // SM-MS图床
	's1.ax1x.com', 's2.ax1x.com', 'z3.ax1x.com', 's4.ax1x.com', // 路过图床
	'i.postimg.cc', 'gimg2.baidu.com', // Postimages图床 百度
	'files.catbox.moe', 'img.thz.cool', 'img.liyuv.top', 'share.lyka.pro', // 这些是ee加的（被打
	document.domain,    // 允许我自己
	'img.zhangsoft.cf',    // 小张图床
	'bed.paperee.repl.co',    // 纸片君ee的纸床
	'imagebed.s1.bitiful.net','imagebed.s2.bitiful.net','imagebed.s3.bitiful.net','imagebed.s4.bitiful.net',    //Dr0让加的()
	'captcha.dr0.lol',        // Dr0's Captcha
	//cmd：下面是OsMe 加的
	'cdn.luogu.com',//洛谷图床()
];

function getDomain(link) {
	var a = document.createElement('a');
	a.href = link;
	return a.hostname;
}

function isWhiteListed(link) {
	return imgHostWhitelist.indexOf(getDomain(link)) !== -1;
}

md.renderer.rules.image = function (tokens, idx, options) {
	var src = Remarkable.utils.escapeHtml(tokens[idx].src);

	if (isWhiteListed(src) && allowImages) {
		var imgSrc = ' src="' + Remarkable.utils.escapeHtml(tokens[idx].src) + '"';
		var title = tokens[idx].title ? (' title="' + Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(tokens[idx].title)) + '"') : '';
		var alt = ' alt="' + (tokens[idx].alt ? Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(Remarkable.utils.unescapeMd(tokens[idx].alt))) : '') + '"';
		var suffix = options.xhtmlOut ? ' /' : '';
		var scrollOnload = isAtBottom() ? ' onload="window.scrollTo(0, document.body.scrollHeight)"' : '';
		return '<a href="' + src + '" target="_blank" rel="noreferrer"><img' + scrollOnload + imgSrc + alt + title + suffix + '></a>';
	}

	return '<a href="' + src + '" target="_blank" rel="noreferrer">' + Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(src)) + '</a>';
};

md.renderer.rules.link_open = function (tokens, idx, options) {
	var title = tokens[idx].title ? (' title="' + Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(tokens[idx].title)) + '"') : '';
	var target = options.linkTarget ? (' target="' + options.linkTarget + '"') : '';
	return '<a rel="noreferrer" onclick="return verifyLink(this)" href="' + Remarkable.utils.escapeHtml(tokens[idx].href) + '"' + title + target + '>';
};

md.renderer.rules.text = function (tokens, idx) {
	tokens[idx].content = Remarkable.utils.escapeHtml(tokens[idx].content);

	if (tokens[idx].content.indexOf('?') !== -1) {
		tokens[idx].content = tokens[idx].content.replace(/(^|\s)(\?)\S+?(?=[,.!?:)]?\s|$)/gm, function (match) {
			var channelLink = Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(match.trim()));
			var whiteSpace = '';
			if (match[0] !== '?') {
				whiteSpace = match[0];
			}
			return whiteSpace + '<a href="' + channelLink + '" target="_blank">' + channelLink + '</a>';
		});
	}

	return tokens[idx].content;
};

md.use(remarkableKatex);

function verifyLink(link) {
	var linkHref = Remarkable.utils.escapeHtml(Remarkable.utils.replaceEntities(link.href));
	if (linkHref !== link.innerHTML) {
		return confirm('警告！你即将离开LuminaChat，前往：' + linkHref);
	}

	return true;
}

var verifyNickname = function (nick) {
	return /^[a-zA-Z0-9_]{1,24}$/.test(nick);
}

var frontpage = `
# Lumina.Chat
版本: `+clientversion+`

***

欢迎来到Lumina.Chat, 一个简洁主题的聊天室。
Lumina是拉丁语中“光”的意思，我们希望此聊天室像阳光一样充满活力和生机。

***

主聊天室: ?main

***

您也可以自己创建聊天室，用以下链接来创建：
\`${document.location.href}?<你的聊天室名称>\`
聊天室名称最好是纯英文。

***

我们欢迎且诚挚的感谢开发者们的贡献！
查看我们的 Github 仓库：https://github.com/LuminaChat/main

***

呈上，
LuminaChat [开发组](https://github.com/orgs/LuminaChat/people) 和 [社区贡献者们](https://github.com/LuminaChat/main/graphs/contributors)
`

function $(query) {
	return document.querySelector(query);
}

function localStorageGet(key) {
	try {
		return window.localStorage[key]
	} catch (e) { }
}

function localStorageSet(key, val) {
	try {
		window.localStorage[key] = val
	} catch (e) { }
}

var ws;
var myNick = localStorageGet('my-nick') || '';
var myChannel = window.location.search.replace(/^\?/, '');
var lastSent = [""];
var lastSentPos = 0;

/** Notification switch and local storage behavior **/
var notifySwitch = document.getElementById("notify-switch")
var notifySetting = localStorageGet("notify-api")
var notifyPermissionExplained = 0; // 1 = granted msg shown, -1 = denied message shown

// Inital request for notifications permission
function RequestNotifyPermission() {
	try {
		var notifyPromise = Notification.requestPermission();
		if (notifyPromise) {
			notifyPromise.then(function (result) {
				console.log("Hack.Chat notification permission: " + result);
				if (result === "granted") {
					if (notifyPermissionExplained === 0) {
						pushMessage({
							cmd: "chat",
							nick: "*",
							text: "成功获取通知权限！",
							time: null
						});
						notifyPermissionExplained = 1;
					}
					return false;
				} else {
					if (notifyPermissionExplained === 0) {
						pushMessage({
							cmd: "chat",
							nick: "*",
							text: "通知权限被拒绝，如果有人提到您，您将不会收到通知。",
							time: null
						});
						notifyPermissionExplained = -1;
					}
					return true;
				}
			});
		}
	} catch (error) {
		pushMessage({
			cmd: "chat",
			nick: "*",
			text: "无法创建通知",
			time: null
		});
		console.error("试图请求通知权限时出错。此浏览器可能不支持桌面通知。\n详细信息:")
		console.error(error)
		return false;
	}
}

// Update localStorage with value of checkbox
notifySwitch.addEventListener('change', (event) => {
	if (event.target.checked) {
		RequestNotifyPermission();
	}
	localStorageSet("notify-api", notifySwitch.checked)
})
// Check if localStorage value is set, defaults to OFF
if (notifySetting === null) {
	localStorageSet("notify-api", "false")
	notifySwitch.checked = false
}
// Configure notifySwitch checkbox element
if (notifySetting === "true" || notifySetting === true) {
	notifySwitch.checked = true
} else if (notifySetting === "false" || notifySetting === false) {
	notifySwitch.checked = false
}

/** Sound switch and local storage behavior **/
var soundSwitch = document.getElementById("sound-switch")
var notifySetting = localStorageGet("notify-sound")

// Update localStorage with value of checkbox
soundSwitch.addEventListener('change', (event) => {
	localStorageSet("notify-sound", soundSwitch.checked)
})
// Check if localStorage value is set, defaults to OFF
if (notifySetting === null) {
	localStorageSet("notify-sound", "false")
	soundSwitch.checked = false
}
// Configure soundSwitch checkbox element
if (notifySetting === "true" || notifySetting === true) {
	soundSwitch.checked = true
} else if (notifySetting === "false" || notifySetting === false) {
	soundSwitch.checked = false
}

// Create a new notification after checking if permission has been granted
function spawnNotification(title, body) {
	// Let's check if the browser supports notifications
	if (!("Notification" in window)) {
		console.error("This browser does not support desktop notification");
	} else if (Notification.permission === "granted") { // Check if notification permissions are already given
		// If it's okay let's create a notification
		var options = {
			body: body,
			icon: "/favicon-96x96.png"
		};
		var n = new Notification(title, options);
	}
	// Otherwise, we need to ask the user for permission
	else if (Notification.permission !== "denied") {
		if (RequestNotifyPermission()) {
			var options = {
				body: body,
				icon: "/favicon-96x96.png"
			};
			var n = new Notification(title, options);
		}
	} else if (Notification.permission == "denied") {
		// At last, if the user has denied notifications, and you
		// want to be respectful, there is no need to bother them any more.
	}
}

function notify(args) {
	// Spawn notification if enabled
	if (notifySwitch.checked) {
		spawnNotification("?" + myChannel + "  —  " + args.nick, args.text)
	}

	// Play sound if enabled
	if (soundSwitch.checked) {
		var soundPromise = document.getElementById("notify-sound").play();
		if (soundPromise) {
			soundPromise.catch(function (error) {
				console.error("Problem playing sound:\n" + error);
			});
		}
	}
}

function join(channel) {
	if (document.location.hostname == 'lumina.chat') {
		// For https://lumina.chat/
		ws = new WebSocket('wss://websocket.lumina.chat:11451/'); //homo port（喜
	} else {
		// for local installs
		var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
		// 如果你修改了端口号，
		// 那么就需要在这里修改（如:8080）
		// 如果你修改了ws的路径，
		// 也要在这里修改（如：/dqj_ws）
		var wsPath = ':6060';
		ws = new WebSocket(protocol + '//' + document.location.hostname + wsPath);
	}

	var wasConnected = false;

	ws.onopen = function () {
		var shouldConnect = true;
		if (!wasConnected) {
			if (location.hash) {
				myNick = location.hash.substr(1);
			} else {
				var newNick = prompt('输入您的用户名', myNick);
				if (newNick !== null) {
					myNick = newNick;
				} else {
					// The user cancelled the prompt in some manner
					shouldConnect = false;
				}
			}
		}

		if (myNick && shouldConnect) {
			localStorageSet('my-nick', myNick);
			send({ cmd: 'join', channel: channel, nick: myNick });
		}

		wasConnected = true;
	}

	ws.onclose = function () {
		if (wasConnected) {
			pushMessage({ nick: '!', text: "掉线了！正在尝试重连..." });
		}

		window.setTimeout(function () {
			join(channel);
		}, 2000);
	}

	ws.onmessage = function (message) {
		var args = JSON.parse(message.data);
		var cmd = args.cmd;
		var command = COMMANDS[cmd];
		command.call(null, args);
	}
}

var COMMANDS = {
	chat: function (args) {
		if (ignoredUsers.indexOf(args.nick) >= 0) {
			return;
		}
		pushMessage(args);
	},

	info: function (args) {
		args.nick = '*';
		pushMessage(args);
	},

	warn: function (args) {
		args.nick = '!';
		pushMessage(args);
	},

	onlineSet: function (args) {
		var nicks = args.nicks;

		usersClear();

		nicks.forEach(function (nick) {
			userAdd(nick);
		});

		pushMessage({ nick: '*', text: "在线的用户: " + nicks.join(", ") })
	},

	onlineAdd: function (args) {
		var nick = args.nick;

		userAdd(nick);

		if ($('#joined-left').checked) {
			pushMessage({ nick: '*', text: nick + " 加入了聊天室" });
		}
	},

	onlineRemove: function (args) {
		var nick = args.nick;

		userRemove(nick);

		if ($('#joined-left').checked) {
			pushMessage({ nick: '*', text: nick + " 退出了聊天室" });
		}
	}
}

function pushMessage(args) {
	// Message container
	var messageEl = document.createElement('div');

	if (
		typeof (myNick) === 'string' && (
			args.text.match(new RegExp('@' + myNick.split('#')[0] + '\\b', "gi")) ||
			((args.type === "whisper" || args.type === "invite") && args.from)
		)
	) {
		notify(args);
	}

	messageEl.classList.add('message');

	if (verifyNickname(myNick.split('#')[0]) && args.nick == myNick.split('#')[0]) {
		messageEl.classList.add('me');
	} else if (args.nick == '!') {
		messageEl.classList.add('warn');
	} else if (args.nick == '*') {
		messageEl.classList.add('info');
	} else if (args.admin) {
		messageEl.classList.add('admin');
	} else if (args.mod) {
		messageEl.classList.add('mod');
	}

	// Nickname
	var nickSpanEl = document.createElement('span');
	nickSpanEl.classList.add('nick');
	messageEl.appendChild(nickSpanEl);

	if (args.trip) {
		var tripEl = document.createElement('span');
		tripEl.textContent = args.trip + " ";
		tripEl.classList.add('trip');
		nickSpanEl.appendChild(tripEl);
	}

	if (args.nick) {
		var nickLinkEl = document.createElement('a');
		nickLinkEl.textContent = args.nick;

		nickLinkEl.onclick = function () {
			insertAtCursor("@" + args.nick + " ");
			$('#chatinput').focus();
		}

		var date = new Date(args.time || Date.now());
		nickLinkEl.title = date.toLocaleString();
		nickSpanEl.appendChild(nickLinkEl);
	}

	// Text
	var textEl = document.createElement('p');
	textEl.classList.add('text');
	textEl.innerHTML = md.render(args.text);

	messageEl.appendChild(textEl);

	// Scroll to bottom
	var atBottom = isAtBottom();
	$('#messages').appendChild(messageEl);
	if (atBottom) {
		window.scrollTo(0, document.body.scrollHeight);
	}

	unread += 1;
	updateTitle();
}

function insertAtCursor(text) {
	var input = $('#chatinput');
	var start = input.selectionStart || 0;
	var before = input.value.substr(0, start);
	var after = input.value.substr(start);

	before += text;
	input.value = before + after;
	input.selectionStart = input.selectionEnd = before.length;

	updateInputSize();
}

function send(data) {
	if (ws && ws.readyState == ws.OPEN) {
		ws.send(JSON.stringify(data));
	}
}

var windowActive = true;
var unread = 0;

window.onfocus = function () {
	windowActive = true;

	updateTitle();
}

window.onblur = function () {
	windowActive = false;
}

window.onscroll = function () {
	if (isAtBottom()) {
		updateTitle();
	}
}

function isAtBottom() {
	return (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 1);
}

function updateTitle() {
	if (windowActive && isAtBottom()) {
		unread = 0;
	}

	var title;
	if (myChannel) {
		title = "?" + myChannel + " - LuminaChat";
	} else {
		title = "LuminaChat";
	}

	if (unread > 0) {
		title = '(' + unread + ') ' + title;
	}

	document.title = title;
}

$('#footer').onclick = function () {
	$('#chatinput').focus();
}

$('#chatinput').onkeydown = function (e) {
	if (e.keyCode == 13 /* ENTER */ && !e.shiftKey) {
		e.preventDefault();

		// Submit message
		if (e.target.value != '') {
			var text = e.target.value;
			e.target.value = '';

			send({ cmd: 'chat', text: text });

			lastSent[0] = text;
			lastSent.unshift("");
			lastSentPos = 0;

			updateInputSize();
		}
	} else if (e.keyCode == 38 /* UP */) {
		// Restore previous sent messages
		if (e.target.selectionStart === 0 && lastSentPos < lastSent.length - 1) {
			e.preventDefault();

			if (lastSentPos == 0) {
				lastSent[0] = e.target.value;
			}

			lastSentPos += 1;
			e.target.value = lastSent[lastSentPos];
			e.target.selectionStart = e.target.selectionEnd = e.target.value.length;

			updateInputSize();
		}
	} else if (e.keyCode == 40 /* DOWN */) {
		if (e.target.selectionStart === e.target.value.length && lastSentPos > 0) {
			e.preventDefault();

			lastSentPos -= 1;
			e.target.value = lastSent[lastSentPos];
			e.target.selectionStart = e.target.selectionEnd = 0;

			updateInputSize();
		}
	} else if (e.keyCode == 27 /* ESC */) {
		e.preventDefault();

		// Clear input field
		e.target.value = "";
		lastSentPos = 0;
		lastSent[lastSentPos] = "";

		updateInputSize();
	} else if (e.keyCode == 9 /* TAB */) {
		// Tab complete nicknames starting with @

		if (e.ctrlKey) {
			// Skip autocompletion and tab insertion if user is pressing ctrl
			// ctrl-tab is used by browsers to cycle through tabs
			return;
		}
		e.preventDefault();

		var pos = e.target.selectionStart || 0;
		var text = e.target.value;
		var index = text.lastIndexOf('@', pos);

		var autocompletedNick = false;

		if (index >= 0) {
			var stub = text.substring(index + 1, pos).toLowerCase();
			// Search for nick beginning with stub
			var nicks = onlineUsers.filter(function (nick) {
				return nick.toLowerCase().indexOf(stub) == 0
			});

			if (nicks.length > 0) {
				autocompletedNick = true;
				if (nicks.length == 1) {
					insertAtCursor(nicks[0].substr(stub.length) + " ");
				}
			}
		}

		// Since we did not insert a nick, we insert a tab character
		if (!autocompletedNick) {
			insertAtCursor('\t');
		}
	}
}

function updateInputSize() {
	var atBottom = isAtBottom();

	var input = $('#chatinput');
	input.style.height = 0;
	input.style.height = input.scrollHeight + 'px';
	document.body.style.marginBottom = $('#footer').offsetHeight + 'px';

	if (atBottom) {
		window.scrollTo(0, document.body.scrollHeight);
	}
}

$('#chatinput').oninput = function () {
	updateInputSize();
}

updateInputSize();

/* sidebar */

$('#sidebar').onmouseenter = $('#sidebar').ontouchstart = function (e) {
	$('#sidebar-content').classList.remove('hidden');
	$('#sidebar').classList.add('expand');
	e.stopPropagation();
}

$('#sidebar').onmouseleave = document.ontouchstart = function (event) {
	var e = event.toElement || event.relatedTarget;
	try {
		if (e.parentNode == this || e == this) {
			return;
		}
	} catch (e) { return; }

	if (!$('#pin-sidebar').checked) {
		$('#sidebar-content').classList.add('hidden');
		$('#sidebar').classList.remove('expand');
	}
}

$('#clear-messages').onclick = function () {
	// Delete children elements
	var messages = $('#messages');
	messages.innerHTML = '';
}

// Restore settings from localStorage

if (localStorageGet('pin-sidebar') == 'true') {
	$('#pin-sidebar').checked = true;
	$('#sidebar-content').classList.remove('hidden');
}

if (localStorageGet('joined-left') == 'false') {
	$('#joined-left').checked = false;
}

if (localStorageGet('parse-latex') == 'false') {
	$('#parse-latex').checked = false;
	md.inline.ruler.disable(['katex']);
	md.block.ruler.disable(['katex']);
}

$('#pin-sidebar').onchange = function (e) {
	localStorageSet('pin-sidebar', !!e.target.checked);
}

$('#joined-left').onchange = function (e) {
	localStorageSet('joined-left', !!e.target.checked);
}

$('#parse-latex').onchange = function (e) {
	var enabled = !!e.target.checked;
	localStorageSet('parse-latex', enabled);
	if (enabled) {
		md.inline.ruler.enable(['katex']);
		md.block.ruler.enable(['katex']);
	} else {
		md.inline.ruler.disable(['katex']);
		md.block.ruler.disable(['katex']);
	}
}

if (localStorageGet('syntax-highlight') == 'false') {
	$('#syntax-highlight').checked = false;
	markdownOptions.doHighlight = false;
}

$('#syntax-highlight').onchange = function (e) {
	var enabled = !!e.target.checked;
	localStorageSet('syntax-highlight', enabled);
	markdownOptions.doHighlight = enabled;
}

if (localStorageGet('allow-imgur') == 'false') {
	$('#allow-imgur').checked = false;
	allowImages = false;
}

$('#allow-imgur').onchange = function (e) {
	var enabled = !!e.target.checked;
	localStorageSet('allow-imgur', enabled);
	allowImages = enabled;
}

// User list
var onlineUsers = [];
var ignoredUsers = [];

function userAdd(nick) {
	var user = document.createElement('a');
	user.textContent = nick;

	user.onclick = function (e) {
		userInvite(nick)
	}

	var userLi = document.createElement('li');
	userLi.appendChild(user);
	$('#users').appendChild(userLi);
	onlineUsers.push(nick);
}

function userRemove(nick) {
	var users = $('#users');
	var children = users.children;

	for (var i = 0; i < children.length; i++) {
		var user = children[i];
		if (user.textContent == nick) {
			users.removeChild(user);
		}
	}

	var index = onlineUsers.indexOf(nick);
	if (index >= 0) {
		onlineUsers.splice(index, 1);
	}
}

function usersClear() {
	var users = $('#users');

	while (users.firstChild) {
		users.removeChild(users.firstChild);
	}

	onlineUsers.length = 0;
}

function userInvite(nick) {
	send({ cmd: 'invite', nick: nick });
}

function userIgnore(nick) {
	ignoredUsers.push(nick);
}

/* color scheme switcher */

var schemes = [
	"default"
];

var highlights = [
	'agate',
	'androidstudio',
	'atom-one-dark',
	'darcula',
	'github',
	'rainbow',
	'tk-night',
	'tomorrow',
	'xcode',
	'zenburn'
]

var currentScheme = 'default';
var currentHighlight = 'xcode';

function setScheme(scheme) {
	currentScheme = scheme;
	$('#scheme-link').href = "schemes/" + scheme + ".css";
	localStorageSet('scheme', scheme);
}

function setHighlight(scheme) {
	currentHighlight = scheme;
	$('#highlight-link').href = "vendor/hljs/styles/" + scheme + ".min.css";
	localStorageSet('highlight', scheme);
}

// Add scheme options to dropdown selector
schemes.forEach(function (scheme) {
	var option = document.createElement('option');
	option.textContent = scheme;
	option.value = scheme;
	$('#scheme-selector').appendChild(option);
});

highlights.forEach(function (scheme) {
	var option = document.createElement('option');
	option.textContent = scheme;
	option.value = scheme;
	$('#highlight-selector').appendChild(option);
});

$('#scheme-selector').onchange = function (e) {
	setScheme(e.target.value);
}

$('#highlight-selector').onchange = function (e) {
	setHighlight(e.target.value);
}

// Load sidebar configaration values from local storage if available
if (localStorageGet('scheme')) {
	setScheme(localStorageGet('scheme'));
}

if (localStorageGet('highlight')) {
	setHighlight(localStorageGet('highlight'));
}

$('#scheme-selector').value = currentScheme;
$('#highlight-selector').value = currentHighlight;

/* main */

if (myChannel == '') {
	pushMessage({ text: frontpage });
	$('#footer').classList.add('hidden');
	$('#sidebar').classList.add('hidden');
} else {
	join(myChannel);
}
