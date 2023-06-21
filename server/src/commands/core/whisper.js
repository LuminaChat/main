/*
  Description: Display text on targets screen that only they can see
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
export async function run(core, server, socket, payload) {
  // check user input
  const text = parseText(payload.text);

  if (!text) {
    // lets not send objects or empty text, yea?
    return server.police.frisk(socket.address, 13);
  }

  // check for spam
  const score = text.length / 83 / 4;
  if (server.police.frisk(socket.address, score)) {
    return server.reply({
      cmd: 'warn',
      text: '你发送的消息太多了。请稍等，然后重试。',
    }, socket);
  }

  const targetNick = payload.nick;
  if (!UAC.verifyNickname(targetNick)) {
    return true;
  }

  // find target user
  let targetClient = server.findSockets({ channel: socket.channel, nick: targetNick });

  if (targetClient.length === 0) {
    return server.reply({
      cmd: 'warn',
      text: '在频道中找不到用户',
    }, socket);
  }

  [targetClient] = targetClient;

  server.reply({
    cmd: 'info',
    type: 'whisper',
    from: socket.nick,
    trip: socket.trip || 'null',
    text: `${socket.nick} 悄悄对你说: ${text}`,
    rawtext: text,
  }, targetClient);

  targetClient.whisperReply = socket.nick;

  server.reply({
    cmd: 'info',
    type: 'whisper',
    text: `你悄悄对 ${targetNick} 说: ${text}`,
  }, socket);

  return true;
}

// module hook functions
export function initHooks(server) {
  server.registerHook('in', 'chat', this.whisperCheck.bind(this), 20);
}

// hooks chat commands checking for /whisper
export function whisperCheck(core, server, socket, payload) {
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (payload.text.startsWith('/whisper') || payload.text.startsWith('/w ')) {
    const input = payload.text.split(' ');

    // If there is no nickname target parameter
    if (input[1] === undefined) {
      server.reply({
        cmd: 'warn',
        text: '有关如何使用此命令的说明，请参阅`/help whisper`。',
      }, socket);

      return false;
    }

    const target = input[1].replace(/@/g, '');
    input.splice(0, 2);
    const whisperText = input.join(' ');

    this.run(core, server, socket, {
      cmd: 'whisper',
      nick: target,
      text: whisperText,
    });

    return false;
  }

  if (payload.text.startsWith('/r ')) {
    if (typeof socket.whisperReply === 'undefined') {
      server.reply({
        cmd: 'warn',
        text: '你还尚未收到过私聊',
      }, socket);

      return false;
    }

    const input = payload.text.split(' ');
    input.splice(0, 1);
    const whisperText = input.join(' ');

    this.run(core, server, socket, {
      cmd: 'whisper',
      nick: socket.whisperReply,
      text: whisperText,
    });

    return false;
  }

  return payload;
}

export const requiredData = ['nick', 'text'];
export const info = {
  name: 'whisper',
  description: '私聊',
  usage: `
    API: { cmd: 'whisper', nick: '<呢称>', text: '<文本>' }
    文本: /whisper <呢称> <文本>
    文本: /w <呢称> <文本>
    简短文本: /r <回复最后一个给你私信的人>`,
};
