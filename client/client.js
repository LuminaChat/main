/*
 *
 * NOTE: The client side of hack.chat is currently in development,
 * a new, more modern but still minimal version will be released
 * soon. As a result of this, the current code has been deprecated
 * and will not actively be updated.
 *
*/
const clientversion = 'lmc-2.1-release';
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
var imgHostWhitelist = [
	//hack.chat自带
	'i.imgur.com',
	'imgur.com',
	//cmd：下面的是复制的zhc（被打
	'i.loli.net', 's2.loli.net', // SM-MS图床
	's1.ax1x.com', 's2.ax1x.com', 'z3.ax1x.com', 's4.ax1x.com', // 路过图床
	'i.postimg.cc', 'gimg2.baidu.com', // Postimages图床 百度
	'files.catbox.moe', 'img.thz.cool', 'img.liyuv.top', 'share.lyka.pro', // 这些是ee加的（被打
	document.location.domain,    // 允许我自己
	'img.zhangsoft.cf',    // 小张图床
	'bed.paperee.repl.co',    // 纸片君ee的纸床
	'imagebed.s3.bitiful.net',    //Dr0让加的()
	//cmd：下面是OsMe 加的
	'cdn.luogu.com.cn',//洛谷图床()
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
		return confirm('Warning, please verify this is where you want to go: ' + linkHref);
	}

	return true;
}

var verifyNickname = function (nick) {
	return /^[a-zA-Z0-9_]{1,24}$/.test(nick);
}

var frontpage =`
# Lumina.Chat
版本: ${clientversion}

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

我们始终欢迎开发者们来为我们贡献代码！
查看我们的 Github 仓库：https://github.com/LuminaChat/main
如果你有问题，可以去查看[FAQ(常见问题)表](/faqs.html)。

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

/**
 * Stores active messages
 * These are messages that can be edited.
 * @type {{ customId: string, userid: number, sent: number, text: string, elem: HTMLElement }[]}
 */
var activeMessages = [];

setInterval(function () {
	var editTimeout = 6 * 60 * 1000;
	var now = Date.now();
	for (var i = 0; i < activeMessages.length; i++) {
		if (now - activeMessages[i].sent > editTimeout) {
			activeMessages.splice(i, 1);
			i--;
		}
	}
}, 30 * 1000);

function addActiveMessage(customId, userid, text, elem) {
	activeMessages.push({
		customId,
		userid,
		sent: Date.now(),
		text,
		elem,
	});
}

/** Notification switch and local storage behavior **/
var notifySwitch = document.getElementById("notify-switch")
var notifySetting = localStorageGet("notify-api")
var notifyPermissionExplained = 0; // 1 = granted msg shown, -1 = denied message shown

// Initial request for notifications permission
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
							text: "成功获取通知权限",
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
		console.error("An error occured trying to request notification permissions. This browser might not support desktop notifications.\nDetails:")
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
		// 也要在这里修改（如：/chat_ws）
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
		if (command) {
			command.call(null, args);
		}
	}
}

var COMMANDS = {
	chat: function (args) {
		if (ignoredUsers.indexOf(args.nick) >= 0) {
			return;
		}

		var elem = pushMessage(args);

		if (typeof (args.customId) === 'string') {
			addActiveMessage(args.customId, args.userid, args.text, elem);
		}
	},

	updateMessage: function (args) {
		var customId = args.customId;
		var mode = args.mode;

		if (!mode) {
			return;
		}

		var message;
		for (var i = 0; i < activeMessages.length; i++) {
			var msg = activeMessages[i];
			if (msg.userid === args.userid && msg.customId === customId) {
				message = msg;
				break;
			}
		}

		if (!message) {
			return;
		}

		var textElem = message.elem.querySelector('.text');
		if (!textElem) {
			return;
		}

		var newText = message.text;
		if (mode === 'overwrite') {
			newText = args.text;
		} else if (mode === 'append') {
			newText += args.text;
		} else if (mode === 'prepend') {
			newText = args.text + newText;
		}

		message.text = newText;

		// Scroll to bottom if necessary
		var atBottom = isAtBottom();

		textElem.innerHTML = md.render(newText);

		if (atBottom) {
			window.scrollTo(0, document.body.scrollHeight);
		}
	},

	info: function (args) {
		args.nick = '*';
		pushMessage(args);
	},

	emote: function (args) {
		args.nick = '*';
		pushMessage(args);
	},

	warn: function (args) {
		args.nick = '!';
		pushMessage(args);
	},

	session: function (args) {
		args.nick = '*';
		pushMessage({nick: '*', text: "您可以通过`/session "+args.token+"`恢复本次会话。请注意：session需保密，否则他人可以冒充您进入聊天室。"});
	},

	onlineSet: function (args) {
		var nicks = args.nicks;

		usersClear();

		nicks.forEach(function (nick) {
			userAdd(nick);
		});

		pushMessage({ nick: '*', text: "在线用户: " + nicks.join(", ") })
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
			pushMessage({ nick: '*', text: nick + " 离开了聊天室" });
		}
	},

	captcha: function (args) {
		var messageEl = document.createElement('div');
		messageEl.classList.add('info');


		var nickSpanEl = document.createElement('span');
		nickSpanEl.classList.add('nick');
		messageEl.appendChild(nickSpanEl);

		var nickLinkEl = document.createElement('a');
		nickLinkEl.textContent = '#';
		nickSpanEl.appendChild(nickLinkEl);

		var textEl = document.createElement('pre');
		textEl.style.fontSize = '4px';
		textEl.classList.add('text');
		textEl.innerHTML = args.text;

		messageEl.appendChild(textEl);
		$('#messages').appendChild(messageEl);

		window.scrollTo(0, document.body.scrollHeight);
	}
}
var localCommands = {
	dumb: function (e) {
		send({ cmd: 'dumb', nick: e.args[0] });
	},

	kick(e) {
		send(e.args.length >= 2 ? { cmd: 'kick', nick: e.args[0] } : { cmd: 'kick', nick: e.args[0], to: e.args[1] })
	},
	join(e) {
		send({ cmd: 'join', channel: e.args[0], nick: e.args[1] })
	},
	lock(e) {
		send({ cmd: 'lockroom'})
	},
	unlock(e) {
		send({ cmd: 'unlockroom'})
	},
	session(e) {
		send({ 
		  cmd: 'session',
		  token: e.args[0]
		})
	},
	ban(e) {
		ws.send(JSON.stringify({
			cmd: 'ban',
			nick: e.args[0]
		}))
	},
	moveuser(e) {
		ws.send(JSON.stringify({
			cmd: 'moveuser',
			nick: e.args[0],
			channel: e.args[1]
		}))
	},
	speak(e) {
		if (e.args[0].indexOf(".") == -1) {
			ws.send(JSON.stringify({
				cmd: 'speak',
				hash: e.args[0]
			}))
		} else {
			ws.send(JSON.stringify({
				cmd: 'speak',
				ip: e.args[0]
			}))
		}
	},
	reload() {
		sendEx('reload');
	},
	shout(e) {
		send({
			cmd: "shout",
			text: e.text
		})
	},
	story() {
		send({ cmd: 'chat', text: '我们不该是书写自己的故事\n\n而这不过是其中的一章\n在你书写我们的故事前\n请确定双手的干净' })
	},
	roll(e){
		pushMessage({ nick: "*", text: 'Rick_Astley 加入了聊天室'})
		pushMessage({nick:"Rick_Astley",text:"Never gonna give you up"})
		pushMessage({ nick: "*", text: 'Rick_Astley 离开了聊天室'})
	},
	addmod(e) {
		send({ cmd: 'addmod', trip: e.args[0] })
	},
	removemod(e){
		send({ cmd: 'removemod', trip: e.args[0] })
	},
	byebye() {
		//彩蛋*2
		window.close()
	},
	unbanall(e){
		sendEx('unbanall');
	},
	
	listusers(e){
		sendEx('listusers');
	},


};
function commandHook(e) {
	if (!isCommand(e)) {
		return
	}
	var args = e.split(' ');
	let cmdname = args[0].split("/")[1];
	localCommands[cmdname]({
		text: args.slice(1).join(' '), //完整传入的参数
		rawtext: e,                    //用户发送的完整内容
		name: cmdname,                 //命令名称
		args: args.slice(1)            //已分割的命令参数
	});


}
function sendEx(cmd, args) {
	send({ cmd, ...args });
}
function isCommand(text) {
	return text.startsWith("/") && (typeof localCommands[text.split(" ")[0].split("/")[1]] != "undefined")
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

	if (verifyNickname(myNick) && args.nick == myNick) {
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

		if (args.mod) {
			tripEl.textContent = String.fromCodePoint(11088) + " " + args.trip + " ";
		} else {
			tripEl.textContent = args.trip + " ";
		}

		tripEl.classList.add('trip');
		nickSpanEl.appendChild(tripEl);
	}

	if (args.nick) {
		var nickLinkEl = document.createElement('a');
		nickLinkEl.textContent = args.nick;

		if (args.color && /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(args.color)) {
			nickLinkEl.setAttribute('style', 'color:#' + args.color + ' !important');
		}

		nickLinkEl.onclick = function () {
			insertAtCursor("@" + args.nick + " ");
			$('#chatinput').focus();
		}
		// Thanks to crosst.chat for this part of code!(reply)
		nickLinkEl.oncontextmenu = function (e) {
			e.preventDefault()

			let replyText = '';
			let originalText = args.text;
			let overlongText = false;

			// Cut overlong text
			if (originalText.length > 350) {
				replyText = originalText.slice(0, 350);
				overlongText = true;
			}

			// Add nickname
			if (args.trip) {
				replyText = '>' + args.trip + ' ' + args.nick + '：\n';
			} else {
				replyText = '>' + args.nick + '：\n';
			}

			// Split text by line
			originalText = originalText.split('\n');

			// Cut overlong lines
			if (originalText.length >= 8) {
				originalText = originalText.slice(0, 8);
				overlongText = true;
			}

			for (let replyLine of originalText) {
				// Cut third replied text
				if (!replyLine.startsWith('>>')) {
					replyText += '>' + replyLine + '\n';
				}
			}

			// Add elipsis if text is cutted
			if (overlongText) {
				replyText += '>……\n';
			}
			replyText += '\n';

			// Add mention when reply to others
			if (args.nick != myNick) {
				replyText += '@' + args.nick + ' ';
			}

			// Insert reply text
			replyText += $('#chatinput').value;
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

	return messageEl;
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
		title = "?" + myChannel;
	} else {
		title = "hack.chat";
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

			if (isCommand(text)) {
				commandHook(text)
			} else {
				send({ cmd: 'chat', text: text });
			}


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

// from https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
function checkIsMobileOrTablet() {
	let check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
};

var isMobileOrTablet = checkIsMobileOrTablet();

function updateInputSize() {
	var atBottom = isAtBottom();
	if (!isMobileOrTablet) {
		var input = $('#chatinput');
		input.style.height = 0;
		input.style.height = input.scrollHeight + 'px';
	}

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
	'android',
	'android-white',
	'atelier-dune',
	'atelier-forest',
	'atelier-heath',
	'atelier-lakeside',
	'atelier-seaside',
	'banana',
	'bright',
	'bubblegum',
	'chalk',
	'default',
	'eighties',
	'fresh-green',
	'greenscreen',
	'hacker',
	'maniac',
	'mariana',
	'military',
	'mocha',
	'monokai',
	'nese',
	'ocean',
	'omega',
	'pop',
	'railscasts',
	'solarized',
	'tomorrow'
];

var highlights = [
	'agate',
	'androidstudio',
	'atom-one-dark',
	'darcula',
	'github',
	'rainbow',
	'tomorrow',
	'xcode',
	'zenburn'
]

var currentScheme = 'atelier-dune';
var currentHighlight = 'darcula';

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

// Load sidebar configuration values from local storage if available
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
