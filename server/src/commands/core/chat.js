/*
  Description: Rebroadcasts any `text` to all clients in a `channel`
  这个模块最重要啦（
  已汉化
*/

import * as UAC from '../utility/UAC/_info';

// 模块的支持函数
const parseText = (text) => {
  // 用户输入的是否是字符串类型
  if (typeof text !== 'string') {
    return false;
  }

  let sanitizedText = text;

  // 删除开始和结束处的换行符 //cmd：os你机翻是不是
  sanitizedText = sanitizedText.replace(/^\s*\n|^\s+$|\n\s*$/g, '');
  // 用两个换行来替换3个（或3个以上的换行）
  sanitizedText = sanitizedText.replace(/\n{3,}/g, '\n\n');

  return sanitizedText;
};

// chat模块主代码
export async function run(core, server, socket, data) {
  // 检查用户输入
  const text = parseText(data.text);

  if (!text) {
    // 禁止发送空文本
    return server.police.frisk(socket.address, 13);
  }

  // 检查是否为垃圾信息
  const score = text.length / 83 / 4;
  if (server.police.frisk(socket.address, score)) {
    return server.reply({
      cmd: 'warn',
      text: '你发送消息的速度太快了，请稍后重试。',
    }, socket);
  }

  //构建聊天
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

  // 发送
  server.broadcast(payload, { channel: socket.channel });

  // stats are fun
  core.stats.increment('messages-sent');

  return true;
}

// 模块钩子
export function initHooks(server) {
  server.registerHook('in', 'chat', this.commandCheckIn.bind(this), 20);
  server.registerHook('in', 'chat', this.finalCmdCheck.bind(this), 254);
}

// 检查是否是发送由 '/' 开头的隐藏命令
export function commandCheckIn(core, server, socket, payload) {
  if (typeof payload.text !== 'string') {
    return false;
  }
  //超级nb的隐藏的检查hash的指令
  if (payload.text.startsWith('/myhash')) {
    server.reply({
      cmd: 'info',
      text: `你的Hash为 ${socket.hash}`,
    }, socket);

    return false;
  }

  return payload;
}
//检查命令是否存在问题
export function finalCmdCheck(core, server, socket, payload) {
  if (typeof payload.text !== 'string') {
    return false;
  }
  //命令处理
  if (!payload.text.startsWith('/')) {
    return payload;
  }
  //如果发送的内容是//，那么删除一个/，随后当做文本发送到当前的频道
  if (payload.text.startsWith('//')) {
    payload.text = payload.text.substr(1);

    return payload;
  }
  /*
  js在已返回后，忽略再返回的内容
  如果上面已经返回，那么不会触发下面的未知命令错误并返回false。
  */ 
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
