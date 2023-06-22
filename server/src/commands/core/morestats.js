/*
  Description: Outputs more info than the legacy stats command
*/

// module support functions
const { stripIndents } = require('common-tags');

const formatTime = (time) => {
  let seconds = time[0] + time[1] / 1e9;

  let minutes = Math.floor(seconds / 60);
  seconds %= 60;

  let hours = Math.floor(minutes / 60);
  minutes %= 60;

  const days = Math.floor(hours / 24);
  hours %= 24;

  return `${days.toFixed(0)}天 ${hours.toFixed(0)}小时 ${minutes.toFixed(0)}分钟 ${seconds.toFixed(0)}秒`;
};

// module main
export async function run(core, server, socket) {
  // gather connection and channel count
  let ips = {};
  let channels = {};
  // for (const client of server.clients) {
  server.clients.forEach((client) => {
    if (client.channel) {
      channels[client.channel] = true;
      ips[client.address] = true;
    }
  });

  const uniqueClientCount = Object.keys(ips).length;
  const uniqueChannels = Object.keys(channels).length;

  ips = null;
  channels = null;

  // dispatch info
  server.reply({
    cmd: 'info',
    text: stripIndents`连接数量: ${uniqueClientCount}
                       频道数量: ${uniqueChannels}
                      加入次数: ${(core.stats.get('users-joined') || 0)}
                       邀请次数: ${(core.stats.get('invites-sent') || 0)}
                       消息发送次数: ${(core.stats.get('messages-sent') || 0)}
                       用户封禁数量: ${(core.stats.get('users-banned') || 0)}
                       用户踢出数量: ${(core.stats.get('users-kicked') || 0)}
                       统计信息请求次数: ${(core.stats.get('stats-requested') || 0)}
                      服务器在线时间: ${formatTime(process.hrtime(core.stats.get('start-time')))}
                      **提示：请不要拿着服务器在线时间短来嘲讽站长，有时是因为内核级更新而重启。**`,
  }, socket);

  // stats are fun
  core.stats.increment('stats-requested');
}

// module hook functions
export function initHooks(server) {
  server.registerHook('in', 'chat', this.statsCheck.bind(this), 26);
}

// hooks chat commands checking for /stats
export function statsCheck(core, server, socket, payload) {
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (payload.text.startsWith('/stats')) {
    this.run(core, server, socket, {
      cmd: 'morestats',
    });

    return false;
  }

  return payload;
}

export const info = {
  name: 'morestats',
  description: '向调用的客户端发送当前的服务器统计信息',
  usage: `
    API: { cmd: 'morestats' }
    文本: /stats`,
};
