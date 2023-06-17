/*
  Description: Rebroadcasts any `text` to all clients in a `channel`
  这个模块最重要啦（
  已汉化
*/

import * as UAC from '../utility/UAC/_info';

// module support functions
const parseText = (text) => {
  // verifies user input is text
  if (typeof text !== 'string') {
    return false;
  }

  let sanitizedText = text;

  // strip newlines from beginning and end
  sanitizedText = sanitizedText.replace(/^\s*\n|^\s+$|\n\s*$/g, '');
  // replace 3+ newlines with just 2 newlines
  sanitizedText = sanitizedText.replace(/\n{3,}/g, '\n\n');

  return sanitizedText;
};

// module main
export async function run(core, server, socket, data) {
  // check user input
  const text = parseText(data.text);

  if (!text) {
    // lets not send objects or empty text, yea?
    return server.police.frisk(socket.address, 13);
  }

  // check for spam
  const score = text.length / 83 / 4;
  if (server.police.frisk(socket.address, score)) {
    return server.reply({
      cmd: 'warn',
      text: '你发送消息的速度太快了，请稍后重试。',
    }, socket);
  }

  // build chat payload
  const payload = {
    cmd: 'chat',
    nick: socket.nick,
    text,
    level: socket.level,
  };

  if (UAC.isAdmin(socket.level)) {
    payload.admin = true;
  } else if (UAC.isModerator(socket.level)) {
    payload.mod = true;
  }

  if (socket.trip) {
    payload.trip = socket.trip;
  }

  // broadcast to channel peers
  server.broadcast(payload, { channel: socket.channel });

  // stats are fun
  core.stats.increment('messages-sent');

  return true;
}

// module hook functions
export function initHooks(server) {
  server.registerHook('in', 'chat', this.commandCheckIn.bind(this), 20);
  server.registerHook('in', 'chat', this.finalCmdCheck.bind(this), 254);
}

// checks for miscellaneous '/' based commands
export function commandCheckIn(core, server, socket, payload) {
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (payload.text.startsWith('/myhash')) {
    server.reply({
      cmd: 'info',
      text: `你的Hash为 ${socket.hash}`,
    }, socket);

    return false;
  }

  return payload;
}

export function finalCmdCheck(core, server, socket, payload) {
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (!payload.text.startsWith('/')) {
    return payload;
  }

  if (payload.text.startsWith('//')) {
    payload.text = payload.text.substr(1);

    return payload;
  }

  server.reply({
    cmd: 'warn',
    text: `未知命令: ${payload.text}`,
  }, socket);

  return false;
}

export const requiredData = ['text'];
export const info = {
  name: 'chat',
  description: '在这个频道内发送一条消息',
  usage: `
    API: { cmd: 'chat', text: '<文本>' }
    Text: 在文本输入框里面打字，然后用你的手~~超级使劲用力到能按坏键盘的那种的力度~~按下回车键。\n
    ~~宇宙超级无敌隐藏牛逼哄哄的指令~~:
    /myhash`,
};
