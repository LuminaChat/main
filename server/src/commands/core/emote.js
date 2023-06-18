/*
  Description: Broadcasts an emote to the current channel
  已汉化
*/

// 模块开始函数
const parseText = (text) => {
  // 检查输入类型为string，如果不是string，返回false强制拒绝
  if (typeof text !== 'string') {
    return false;
  }

  let sanitizedText = text;

  // 删除文本开头和结尾的换行
  sanitizedText = sanitizedText.replace(/^\s*\n|^\s+$|\n\s*$/g, '');
  // 把3个换行（或3个以上的换行）替换为2个换行
  sanitizedText = sanitizedText.replace(/\n{3,}/g, '\n\n');

  return sanitizedText;
};

// 模块核心 
export async function run(core, server, socket, payload) {
  // 检查用户文本
  let text = parseText(payload.text);

  if (!text) {
    // 禁止发送空文本或对象，要造反了食不食？
    return server.police.frisk(socket.address, 8); 
  }

  // 检查输入，频率限制
  const score = text.length / 83 / 4;
  if (server.police.frisk(socket.address, score)) {
    return server.reply({
      cmd: 'warn',
      text: '你发的消息太多了！请稍后再试',
    }, socket);
  }

  if (!text.startsWith("'")) {
    text = ` ${text}`;
  }

  const newPayload = {
    cmd: 'info',
    type: 'emote',
    nick: socket.nick,
    text: `@${socket.nick}${text}`,
  };
  if (socket.trip) {
    newPayload.trip = socket.trip;
  }

  // 向指定频道广播消息
  server.broadcast(newPayload, { channel: socket.channel });

  return true;
}

// 模块hook函数
export function initHooks(server) {
  server.registerHook('in', 'chat', this.emoteCheck.bind(this), 30);
}

// hook聊天发送emote命令
export function emoteCheck(core, server, socket, payload) {
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (payload.text.startsWith('/me ')) {
    const input = payload.text.split(' ');

    // 如果他不是一个合法的参数……
    if (input[1] === undefined) {
      server.reply({
        cmd: 'warn',
        text: '使用`/help emote`查看这个命令的帮助',
      }, socket);

      return false; //返回false，让后面的失效
    }

    input.splice(0, 1);
    const actionText = input.join(' ');

    this.run(core, server, socket, {
      cmd: 'emote',
      text: actionText,
    });

    return false; //end
  }

  return payload;
}

export const requiredData = ['text'];
export const info = {
  name: 'emote',
  description: '状态/情绪/动作文本',
  usage: `
  API: { cmd: 'emote', text: '<状态/情绪/动作文本>' }
  文本: /me <状态/情绪/动作文本>`,
};
